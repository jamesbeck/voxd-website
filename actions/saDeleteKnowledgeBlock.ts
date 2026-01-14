"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { addLog } from "@/lib/addLog";

const saDeleteKnowledgeBlock = async ({
  blockId,
}: {
  blockId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  try {
    // Get the block with document and agent info to check ownership and for logging
    const block = await db("knowledgeBlock")
      .join(
        "knowledgeDocument",
        "knowledgeBlock.documentId",
        "knowledgeDocument.id"
      )
      .where("knowledgeBlock.id", blockId)
      .select(
        "knowledgeBlock.id",
        "knowledgeBlock.title",
        "knowledgeBlock.content",
        "knowledgeBlock.blockIndex",
        "knowledgeBlock.tokenCount",
        "knowledgeBlock.documentId",
        "knowledgeDocument.agentId"
      )
      .first();

    if (!block) {
      return { success: false, error: "Knowledge block not found" };
    }

    // Verify the user can access this agent
    if (!(await userCanViewAgent({ agentId: block.agentId }))) {
      return { success: false, error: "Unauthorized" };
    }

    // Log knowledge block deletion before deleting
    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "Knowledge Block Deleted",
      description: `Knowledge block "${block.title || "Untitled"}" deleted`,
      agentId: block.agentId,
      data: {
        blockId,
        deletedBlock: {
          title: block.title,
          content: block.content,
          blockIndex: block.blockIndex,
          tokenCount: block.tokenCount,
          documentId: block.documentId,
        },
      },
    });

    await db("knowledgeBlock").delete().where({ id: blockId });
  } catch (error) {
    console.error("Error deleting knowledge block:", error);
    return { success: false, error: "Error deleting knowledge block" };
  }

  return { success: true };
};

export default saDeleteKnowledgeBlock;
