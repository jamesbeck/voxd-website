"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saMarkQuoteSentToClient = async ({
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

  // Allow marking as proposal with client from "Concept Sent to Client" status
  if (existingQuote.status !== "Concept Sent to Client") {
    return {
      success: false,
      error:
        "Quote can only be marked as proposal with client when in 'Concept Sent to Client' status",
    };
  }

  // Update the quote status to 'Proposal with Client'
  await db("quote").where({ id: quoteId }).update({
    status: "Proposal with Client",
  });

  return { success: true };
};

export default saMarkQuoteSentToClient;
