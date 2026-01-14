"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { addLog } from "@/lib/addLog";

const saCreateKnowledgeBlock = async ({
  documentId,
  content,
  title,
}: {
  documentId: string;
  content: string;
  title?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Get the document and its associated agent's OpenAI API key
  const document = await db("knowledgeDocument")
    .join("agent", "knowledgeDocument.agentId", "agent.id")
    .where("knowledgeDocument.id", documentId)
    .select("knowledgeDocument.*", "agent.openAiApiKey")
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

  // Get the next block index
  const lastBlock = await db("knowledgeBlock")
    .where("documentId", documentId)
    .orderBy("blockIndex", "desc")
    .first();

  const blockIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;

  // Generate embedding using the agent's OpenAI API key
  // Include title in the embedding text if provided
  const embeddingText = title ? `${title}\n\n${content}` : content;
  let embeddingVector: number[] | null = null;
  let tokenCount: number | null = null;
  try {
    const openai = createOpenAI({ apiKey: document.openAiApiKey });
    const { embedding, usage } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: embeddingText,
    });
    embeddingVector = embedding;
    tokenCount = usage?.tokens ?? Math.ceil(embeddingText.length / 4);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return {
      success: false,
      error: `Failed to generate embedding: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  // Create the knowledge block with embedding
  const [newBlock] = await db("knowledgeBlock")
    .insert({
      documentId,
      content,
      title,
      blockIndex,
      tokenCount,
      embedding: embeddingVector ? `[${embeddingVector.join(",")}]` : null,
    })
    .returning([
      "id",
      "content",
      "title",
      "blockIndex",
      "tokenCount",
      "createdAt",
    ]);

  // Log knowledge block creation
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Knowledge Block Created",
    description: `Knowledge block "${title || 'Untitled'}" created`,
    agentId: document.agentId,
    data: {
      blockId: newBlock.id,
      documentId,
      title,
      content,
      blockIndex,
      tokenCount,
    },
  });

  return {
    success: true,
    data: newBlock,
  };
};

export { saCreateKnowledgeBlock };
