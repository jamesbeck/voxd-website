"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateQuoteIntegrationNote = async ({
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
    await db("quoteIntegration").where({ id }).update({ note });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to update note",
    };
  }
};

export default saUpdateQuoteIntegrationNote;
