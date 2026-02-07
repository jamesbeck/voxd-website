"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saMarkQuoteConceptSentToClient = async ({
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

  // Only allow marking as concept sent from Draft status
  if (existingQuote.status !== "Draft") {
    return {
      success: false,
      error: "Quote can only be marked as concept sent when in 'Draft' status",
    };
  }

  // Update the quote status to 'Concept Sent to Client'
  await db("quote").where({ id: quoteId }).update({
    status: "Concept Sent to Client",
  });

  return { success: true };
};

export default saMarkQuoteConceptSentToClient;
