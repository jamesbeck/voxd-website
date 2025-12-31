"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

const saCreateChunk = async ({
  documentId,
  content,
  titlePath,
}: {
  documentId: string;
  content: string;
  titlePath?: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

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

  // Get the next chunk index
  const lastChunk = await db("knowledgeChunk")
    .where("documentId", documentId)
    .orderBy("chunkIndex", "desc")
    .first();

  const chunkIndex = lastChunk ? lastChunk.chunkIndex + 1 : 0;

  // Generate embedding using the agent's OpenAI API key
  let embeddingVector: number[] | null = null;
  let tokenCount: number | null = null;
  try {
    const openai = createOpenAI({ apiKey: document.openAiApiKey });
    const { embedding, usage } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: content,
    });
    embeddingVector = embedding;
    tokenCount = usage?.tokens ?? Math.ceil(content.length / 4);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return {
      success: false,
      error: `Failed to generate embedding: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }

  // Create the chunk with embedding
  const [newChunk] = await db("knowledgeChunk")
    .insert({
      documentId,
      content,
      titlePath,
      chunkIndex,
      tokenCount,
      embedding: embeddingVector ? `[${embeddingVector.join(",")}]` : null,
    })
    .returning([
      "id",
      "content",
      "titlePath",
      "chunkIndex",
      "tokenCount",
      "createdAt",
    ]);

  return {
    success: true,
    data: newChunk,
  };
};

export { saCreateChunk };
