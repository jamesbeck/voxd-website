"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { addLog } from "@/lib/addLog";

const saUpdateKnowledgeBlock = async ({
  blockId,
  content,
  title,
}: {
  blockId: string;
  content: string;
  title?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Get the existing block with document and agent info
  const block = await db("knowledgeBlock")
    .join(
      "knowledgeDocument",
      "knowledgeBlock.documentId",
      "knowledgeDocument.id"
    )
    .join("agent", "knowledgeDocument.agentId", "agent.id")
    .where("knowledgeBlock.id", blockId)
    .select(
      "knowledgeBlock.*",
      "knowledgeDocument.agentId",
      "agent.openAiApiKey"
    )
    .first();

  if (!block) {
    return {
      success: false,
      error: "Knowledge block not found",
    };
  }

  // Verify the user can access this agent
  if (!(await userCanViewAgent({ agentId: block.agentId }))) {
    return { success: false, error: "Unauthorized" };
  }

  if (!block.openAiApiKey) {
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
    const openai = createOpenAI({ apiKey: block.openAiApiKey });
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

  // Update the block with new content and embedding
  const [updatedBlock] = await db("knowledgeBlock")
    .where({ id: blockId })
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
      "blockIndex",
      "tokenCount",
      "createdAt",
    ]);

  // Log knowledge block update
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Knowledge Block Updated",
    description: `Knowledge block "${title || "Untitled"}" updated`,
    agentId: block.agentId,
    data: {
      blockId,
      before: {
        title: block.title,
        content: block.content,
        tokenCount: block.tokenCount,
      },
      after: {
        title,
        content,
        tokenCount,
      },
    },
  });

  return {
    success: true,
    data: updatedBlock,
  };
};

export { saUpdateKnowledgeBlock };
