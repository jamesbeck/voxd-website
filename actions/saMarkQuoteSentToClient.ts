"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saMarkQuoteSentToClient = async ({
  quoteId,
  skipFromDraft = false,
}: {
  quoteId: string;
  skipFromDraft?: boolean;
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

  // Allow marking as proposal with client from "Cost Pricing Received from Voxd" status
  // Or from "Draft" or "Concept Sent to Client" status if skipFromDraft is true (for superAdmins)
  const allowedStatuses = ["Cost Pricing Received from Voxd"];
  if (skipFromDraft) {
    allowedStatuses.push("Draft", "Concept Sent to Client");
  }

  if (!allowedStatuses.includes(existingQuote.status)) {
    return {
      success: false,
      error: skipFromDraft
        ? "Quote can only be marked as proposal with client when in 'Draft', 'Concept Sent to Client', or 'Cost Pricing Received from Voxd' status"
        : "Quote can only be marked as proposal with client when in 'Cost Pricing Received from Voxd' status",
    };
  }

  // Update the quote status to 'Proposal with Client'
  await db("quote").where({ id: quoteId }).update({
    status: "Proposal with Client",
  });

  return { success: true };
};

export default saMarkQuoteSentToClient;
