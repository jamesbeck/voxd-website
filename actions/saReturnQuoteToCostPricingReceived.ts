"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saReturnQuoteToCostPricingReceived = async ({
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

  // Check quote exists and is in the right status
  const quote = await db("quote").where({ id: quoteId }).first();

  if (!quote) {
    return { success: false, error: "Quote not found" };
  }

  if (quote.status !== "Sent to Client") {
    return {
      success: false,
      error:
        "Quote must be in 'With Client' status to return to Cost Pricing Received",
    };
  }

  // Update quote status
  await db("quote")
    .where({ id: quoteId })
    .update({ status: "Cost Pricing Received from Voxd" });

  return { success: true };
};

export default saReturnQuoteToCostPricingReceived;
