"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saDeleteChunk = async ({
  chunkId,
}: {
  chunkId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    // Get the chunk with document and agent info to check ownership
    const chunk = await db("knowledgeChunk")
      .join(
        "knowledgeDocument",
        "knowledgeChunk.documentId",
        "knowledgeDocument.id"
      )
      .where("knowledgeChunk.id", chunkId)
      .select("knowledgeDocument.agentId")
      .first();

    if (!chunk) {
      return { success: false, error: "Chunk not found" };
    }

    // Verify the user can access this agent
    if (!(await userCanViewAgent({ agentId: chunk.agentId }))) {
      return { success: false, error: "Unauthorized" };
    }

    await db("knowledgeChunk").delete().where({ id: chunkId });
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return { success: false, error: "Error deleting chunk" };
  }

  return { success: true };
};

export default saDeleteChunk;
