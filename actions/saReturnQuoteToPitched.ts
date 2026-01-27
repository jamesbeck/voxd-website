"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saReturnQuoteToPitched = async ({
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
  const quote = await db("quote").select("*").where({ id: quoteId }).first();

  if (!quote) {
    return { success: false, error: "Quote not found" };
  }

  if (
    quote.status !== "Sent to Voxd for Cost Pricing" &&
    quote.status !== "Cost Pricing Received from Voxd"
  ) {
    return {
      success: false,
      error:
        "Quote must be in 'Sent to Voxd for Cost Pricing' or 'Cost Pricing Received from Voxd' status to return to Pitched to Client",
    };
  }

  // Update quote status
  await db("quote")
    .where({ id: quoteId })
    .update({ status: "Pitched to Client" });

  return { success: true };
};

export default saReturnQuoteToPitched;
