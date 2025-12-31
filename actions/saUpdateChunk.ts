"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

const saUpdateChunk = async ({
  chunkId,
  content,
  titlePath,
}: {
  chunkId: string;
  content: string;
  titlePath?: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  // Get the existing chunk with document and agent info
  const chunk = await db("knowledgeChunk")
    .join(
      "knowledgeDocument",
      "knowledgeChunk.documentId",
      "knowledgeDocument.id"
    )
    .join("agent", "knowledgeDocument.agentId", "agent.id")
    .where("knowledgeChunk.id", chunkId)
    .select(
      "knowledgeChunk.*",
      "knowledgeDocument.agentId",
      "agent.openAiApiKey"
    )
    .first();

  if (!chunk) {
    return {
      success: false,
      error: "Chunk not found",
    };
  }

  if (!chunk.openAiApiKey) {
    return {
      success: false,
      error: "Agent does not have an OpenAI API key configured",
    };
  }

  // Generate new embedding using the agent's OpenAI API key
  let embeddingVector: number[] | null = null;
  let tokenCount: number | null = null;
  try {
    const openai = createOpenAI({ apiKey: chunk.openAiApiKey });
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

  // Update the chunk with new content and embedding
  const [updatedChunk] = await db("knowledgeChunk")
    .where({ id: chunkId })
    .update({
      content,
      titlePath,
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
    data: updatedChunk,
  };
};

export { saUpdateChunk };
