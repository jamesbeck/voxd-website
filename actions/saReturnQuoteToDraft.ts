"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saReturnQuoteToDraft = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  // Find the existing quote
  const existingQuote = await db("quote")
    .select("*")
    .where({ id: quoteId })
    .first();

  if (!existingQuote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Don't allow if already in Draft status
  if (existingQuote.status === "Draft") {
    return {
      success: false,
      error: "Quote is already in Draft status",
    };
  }

  // Update the quote status to 'Draft'
  await db("quote").where({ id: quoteId }).update({
    status: "Draft",
  });

  return { success: true };
};

export default saReturnQuoteToDraft;
