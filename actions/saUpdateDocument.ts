"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateDocument = async ({
  documentId,
  title,
  description,
  sourceUrl,
  sourceType,
  enabled,
}: {
  documentId: string;
  title?: string;
  description?: string;
  sourceUrl?: string;
  sourceType?: string;
  enabled?: boolean;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  if (!documentId) {
    return {
      success: false,
      error: "Document ID is required",
    };
  }

  const existingDocument = await db("knowledgeDocument")
    .select("*")
    .where({ id: documentId })
    .first();

  if (!existingDocument) {
    return {
      success: false,
      error: "Document not found",
    };
  }

  await db("knowledgeDocument").where({ id: documentId }).update({
    title,
    description,
    sourceUrl,
    sourceType,
    enabled,
    updatedAt: db.fn.now(),
  });

  return { success: true };
};

export default saUpdateDocument;
