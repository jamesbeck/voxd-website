"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saDeleteDocument = async ({
  documentId,
}: {
  documentId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    // Get the document to check agent ownership
    const document = await db("knowledgeDocument")
      .where({ id: documentId })
      .select("agentId")
      .first();

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Verify the user can access this agent
    if (!(await userCanViewAgent({ agentId: document.agentId }))) {
      return { success: false, error: "Unauthorized" };
    }

    // The CASCADE on the foreign key will automatically delete all chunks
    await db("knowledgeDocument").delete().where({ id: documentId });
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Error deleting document" };
  }

  return { success: true };
};

export default saDeleteDocument;
