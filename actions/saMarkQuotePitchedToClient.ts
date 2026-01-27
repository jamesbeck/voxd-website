"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saMarkQuotePitchedToClient = async ({
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

  // Only allow marking as pitched from Draft status
  if (existingQuote.status !== "Draft") {
    return {
      success: false,
      error: "Quote can only be marked as pitched when in 'Draft' status",
    };
  }

  // Update the quote status to 'Pitched to Client'
  await db("quote").where({ id: quoteId }).update({
    status: "Pitched to Client",
  });

  return { success: true };
};

export default saMarkQuotePitchedToClient;
