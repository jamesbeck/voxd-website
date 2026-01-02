"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, embedMany } from "ai";
import { z } from "zod";

const chunkSchema = z.object({
  chunks: z.array(
    z.object({
      title: z
        .string()
        .describe("A short descriptive title for this chunk (max 100 chars)"),
      content: z
        .string()
        .describe(
          "The chunk content. Should be 300-1500 characters, self-contained and coherent"
        ),
    })
  ),
});

const saSmartChunkDocument = async ({
  documentId,
  text,
}: {
  documentId: string;
  text: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

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

  // Get the next chunk index
  const lastChunk = await db("knowledgeChunk")
    .where("documentId", documentId)
    .orderBy("chunkIndex", "desc")
    .first();

  const startIndex = lastChunk ? lastChunk.chunkIndex + 1 : 0;

  // Use LLM to intelligently chunk the text
  let chunks: { title: string; content: string }[];
  try {
    const { object } = await generateObject({
      model: openai(modelName),
      schema: chunkSchema,
      prompt: `You are a knowledge base chunking assistant. Split the following text into semantic chunks for a RAG (Retrieval Augmented Generation) system.

Each chunk should:
- Be a self-contained piece of information (ideally 300-1500 characters)
- Have a short, descriptive title that summarizes its content
- Preserve complete thoughts and context
- Not split mid-sentence or mid-idea
- Be useful as a standalone piece of knowledge that can answer questions

Create chunks that would be helpful when retrieved to answer user questions about this content.

Text to chunk:
${text}`,
    });

    chunks = object.chunks;
  } catch (error) {
    console.error("Error generating chunks with LLM:", error);
    return {
      success: false,
      error: `Failed to generate chunks: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  if (!chunks.length) {
    return {
      success: false,
      error: "No chunks were generated from the text",
    };
  }

  // Generate embeddings for all chunks (include title in embedding text)
  let embeddings: number[][] = [];
  let tokenCounts: number[] = [];
  try {
    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks.map((c) =>
        c.title ? `${c.title}\n\n${c.content}` : c.content
      ),
    });
    embeddings = result.embeddings;
    // Estimate token counts per chunk (including title)
    tokenCounts = chunks.map((c) => {
      const embeddingText = c.title ? `${c.title}\n\n${c.content}` : c.content;
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

  // Insert all chunks
  const chunkRecords = chunks.map((chunk, index) => ({
    documentId,
    content: chunk.content,
    title: chunk.title,
    chunkIndex: startIndex + index,
    tokenCount: tokenCounts[index],
    embedding: embeddings[index] ? `[${embeddings[index].join(",")}]` : null,
  }));

  try {
    await db("knowledgeChunk").insert(chunkRecords);
  } catch (error) {
    console.error("Error inserting chunks:", error);
    return {
      success: false,
      error: "Failed to save chunks to database",
    };
  }

  return {
    success: true,
    data: { chunksCreated: chunks.length },
  };
};

export default saSmartChunkDocument;
