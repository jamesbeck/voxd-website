"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saSubmitQuoteForCostPricing = async ({
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

  //find the existing quote
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

  //update the quote status to 'pending_cost_pricing'
  await db("quote").where({ id: quoteId }).update({
    status: "awaiting cost pricing",
  });

  return { success: true };
};

export default saSubmitQuoteForCostPricing;
