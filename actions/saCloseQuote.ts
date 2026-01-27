"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCloseQuote = async ({
  quoteId,
  outcome,
}: {
  quoteId: string;
  outcome: "won" | "lost";
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  if (!outcome || !["won", "lost"].includes(outcome)) {
    return {
      success: false,
      error: "Valid outcome (won or lost) is required",
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

  // Only allow closing if the quote is in "With Client" status
  if (existingQuote.status !== "With Client") {
    return {
      success: false,
      error: "Quote can only be closed when in 'With Client' status",
    };
  }

  // Update the quote status
  const newStatus = outcome === "won" ? "Closed Won" : "Closed Lost";
  await db("quote").where({ id: quoteId }).update({
    status: newStatus,
  });

  return { success: true };
};

export default saCloseQuote;
