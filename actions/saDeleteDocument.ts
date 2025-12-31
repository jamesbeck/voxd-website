"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";

const saDeleteDocument = async ({
  documentId,
}: {
  documentId: string;
}): Promise<ServerActionResponse> => {
  try {
    // The CASCADE on the foreign key will automatically delete all chunks
    await db("knowledgeDocument").delete().where({ id: documentId });
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Error deleting document" };
  }

  return { success: true };
};

export default saDeleteDocument;
