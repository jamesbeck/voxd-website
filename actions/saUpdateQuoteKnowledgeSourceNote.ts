"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateQuoteKnowledgeSourceNote = async ({
  id,
  note,
}: {
  id: string;
  note: string;
}): Promise<ServerActionResponse> => {
  if (!id) {
    return { success: false, error: "ID is required" };
  }

  try {
    await db("quoteKnowledgeSource").where({ id }).update({ note });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update note",
    };
  }
};

export default saUpdateQuoteKnowledgeSourceNote;
