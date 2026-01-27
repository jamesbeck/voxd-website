"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saReopenQuote = async ({
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

  // Only allow reopening if the quote is in a closed status
  if (
    existingQuote.status !== "Closed Won" &&
    existingQuote.status !== "Closed Lost"
  ) {
    return {
      success: false,
      error: "Quote can only be reopened when in a closed status",
    };
  }

  // Update the quote status back to 'With Client'
  await db("quote").where({ id: quoteId }).update({
    status: "With Client",
  });

  return { success: true };
};

export default saReopenQuote;
