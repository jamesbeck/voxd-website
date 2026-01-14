"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saDeleteKnowledgeBlock = async ({
  blockId,
}: {
  blockId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    // Get the block with document and agent info to check ownership
    const block = await db("knowledgeBlock")
      .join(
        "knowledgeDocument",
        "knowledgeBlock.documentId",
        "knowledgeDocument.id"
      )
      .where("knowledgeBlock.id", blockId)
      .select("knowledgeDocument.agentId")
      .first();

    if (!block) {
      return { success: false, error: "Knowledge block not found" };
    }

    // Verify the user can access this agent
    if (!(await userCanViewAgent({ agentId: block.agentId }))) {
      return { success: false, error: "Unauthorized" };
    }

    await db("knowledgeBlock").delete().where({ id: blockId });
  } catch (error) {
    console.error("Error deleting knowledge block:", error);
    return { success: false, error: "Error deleting knowledge block" };
  }

  return { success: true };
};

export default saDeleteKnowledgeBlock;
