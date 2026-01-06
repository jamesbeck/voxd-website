"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saUpdateChunk = async ({
  chunkId,
  content,
  title,
}: {
  chunkId: string;
  content: string;
  title?: string;
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

  // Verify the user can access this agent
  if (!(await userCanViewAgent({ agentId: chunk.agentId }))) {
    return { success: false, error: "Unauthorized" };
  }

  if (!chunk.openAiApiKey) {
    return {
      success: false,
      error: "Agent does not have an OpenAI API key configured",
    };
  }

  // Generate new embedding using the agent's OpenAI API key
  // Include title in the embedding text if provided
  const embeddingText = title ? `${title}\n\n${content}` : content;
  let embeddingVector: number[] | null = null;
  let tokenCount: number | null = null;
  try {
    const openai = createOpenAI({ apiKey: chunk.openAiApiKey });
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

  // Update the chunk with new content and embedding
  const [updatedChunk] = await db("knowledgeChunk")
    .where({ id: chunkId })
    .update({
      content,
      title,
      tokenCount,
      embedding: embeddingVector ? `[${embeddingVector.join(",")}]` : null,
    })
    .returning([
      "id",
      "content",
      "title",
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
