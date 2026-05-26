"use server";

import db from "@/database/db";
import { addLog } from "@/lib/addLog";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { refreshKnowledgeDocumentFromUrl } from "@/lib/knowledgeDocumentImport";
import { ServerActionResponse } from "@/types/types";

const saRefreshDocumentFromUrl = async ({
  documentId,
}: {
  documentId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  const document = await db("knowledgeDocument")
    .where("id", documentId)
    .first();

  if (!document) {
    return {
      success: false,
      error: "Document not found",
    };
  }

  if (!(await userCanViewAgent({ agentId: document.agentId }))) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const refreshResult = await refreshKnowledgeDocumentFromUrl({ documentId });

    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "Document Refreshed from URL",
      description: `Knowledge document "${document.title}" refreshed from URL`,
      agentId: document.agentId,
      data: {
        documentId,
        sourceUrl: refreshResult.sourceUrl,
        pageTitle: refreshResult.pageTitle,
        blocksCreated: refreshResult.blocksCreated,
      },
    });

    return {
      success: true,
      data: refreshResult,
    };
  } catch (error) {
    console.error("Error refreshing document from URL:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to refresh document from URL",
    };
  }
};

export { saRefreshDocumentFromUrl };
