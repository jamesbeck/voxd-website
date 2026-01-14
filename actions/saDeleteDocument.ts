"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { addLog } from "@/lib/addLog";

const saDeleteDocument = async ({
  documentId,
}: {
  documentId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  try {
    // Get the document to check agent ownership and for logging
    const document = await db("knowledgeDocument")
      .where({ id: documentId })
      .select("*")
      .first();

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Verify the user can access this agent
    if (!(await userCanViewAgent({ agentId: document.agentId }))) {
      return { success: false, error: "Unauthorized" };
    }

    // Log document deletion before deleting
    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "Document Deleted",
      description: `Knowledge document "${document.title}" deleted`,
      agentId: document.agentId,
      data: {
        documentId,
        deletedDocument: {
          title: document.title,
          description: document.description,
          sourceUrl: document.sourceUrl,
          sourceType: document.sourceType,
          enabled: document.enabled,
        },
      },
    });

    // The CASCADE on the foreign key will automatically delete all knowledge blocks
    await db("knowledgeDocument").delete().where({ id: documentId });
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Error deleting document" };
  }

  return { success: true };
};

export default saDeleteDocument;
