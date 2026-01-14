"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, embedMany } from "ai";
import { z } from "zod";
import { addLog } from "@/lib/addLog";

const blockSchema = z.object({
  blocks: z.array(
    z.object({
      title: z
        .string()
        .describe(
          "A short descriptive title for this knowledge block (max 100 chars)"
        ),
      content: z
        .string()
        .describe(
          "The knowledge block content. Should be 300-1500 characters, self-contained and coherent"
        ),
    })
  ),
});

const saSmartImportKnowledgeBlocks = async ({
  documentId,
  text,
}: {
  documentId: string;
  text: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Get the document and its associated agent's OpenAI API key and model
  const document = await db("knowledgeDocument")
    .join("agent", "knowledgeDocument.agentId", "agent.id")
    .leftJoin("model", "agent.modelId", "model.id")
    .where("knowledgeDocument.id", documentId)
    .select(
      "knowledgeDocument.*",
      "agent.openAiApiKey",
      "model.model as modelName"
    )
    .first();

  if (!document) {
    return {
      success: false,
      error: "Document not found",
    };
  }

  if (!document.openAiApiKey) {
    return {
      success: false,
      error: "Agent does not have an OpenAI API key configured",
    };
  }

  // Use agent's configured model or fallback to gpt-4o-mini
  const modelName = document.modelName || "gpt-4o-mini";

  const openai = createOpenAI({ apiKey: document.openAiApiKey });

  // Get the next block index
  const lastBlock = await db("knowledgeBlock")
    .where("documentId", documentId)
    .orderBy("blockIndex", "desc")
    .first();

  const startIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;

  // Use LLM to intelligently split the text into knowledge blocks
  let blocks: { title: string; content: string }[];
  try {
    const { object } = await generateObject({
      model: openai(modelName),
      schema: blockSchema,
      prompt: `You are a knowledge base assistant. Split the following text into semantic knowledge blocks for a RAG (Retrieval Augmented Generation) system.

Each knowledge block should:
- Be a self-contained piece of information (ideally 300-1500 characters)
- Have a short, descriptive title that summarizes its content
- Preserve complete thoughts and context
- Not split mid-sentence or mid-idea
- Be useful as a standalone piece of knowledge that can answer questions

Create knowledge blocks that would be helpful when retrieved to answer user questions about this content.

Text to process:
${text}`,
    });

    blocks = object.blocks;
  } catch (error) {
    console.error("Error generating knowledge blocks with LLM:", error);
    return {
      success: false,
      error: `Failed to generate knowledge blocks: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  if (!blocks.length) {
    return {
      success: false,
      error: "No knowledge blocks were generated from the text",
    };
  }

  // Generate embeddings for all blocks (include title in embedding text)
  let embeddings: number[][] = [];
  let tokenCounts: number[] = [];
  try {
    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: blocks.map((b) =>
        b.title ? `${b.title}\n\n${b.content}` : b.content
      ),
    });
    embeddings = result.embeddings;
    // Estimate token counts per block (including title)
    tokenCounts = blocks.map((b) => {
      const embeddingText = b.title ? `${b.title}\n\n${b.content}` : b.content;
      return Math.ceil(embeddingText.length / 4);
    });
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return {
      success: false,
      error: `Failed to generate embeddings: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  // Insert all knowledge blocks
  const blockRecords = blocks.map((block, index) => ({
    documentId,
    content: block.content,
    title: block.title,
    blockIndex: startIndex + index,
    tokenCount: tokenCounts[index],
    embedding: embeddings[index] ? `[${embeddings[index].join(",")}]` : null,
  }));

  try {
    await db("knowledgeBlock").insert(blockRecords);
  } catch (error) {
    console.error("Error inserting knowledge blocks:", error);
    return {
      success: false,
      error: "Failed to save knowledge blocks to database",
    };
  }

  // Log Smart AI Import usage
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Smart AI Import",
    description: `Smart AI Import created ${blocks.length} knowledge blocks`,
    agentId: document.agentId,
    data: {
      documentId,
      inputText: text,
      blocksCreated: blocks.length,
      generatedBlocks: blocks.map((b) => ({ title: b.title, content: b.content })),
    },
  });

  return {
    success: true,
    data: { blocksCreated: blocks.length },
  };
};

export default saSmartImportKnowledgeBlocks;
