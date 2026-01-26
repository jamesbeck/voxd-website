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

  // Only allow submitting for cost pricing if the quote is in Draft status
  if (existingQuote.status !== "Draft") {
    return {
      success: false,
      error: "Quote has already been submitted for cost pricing",
    };
  }

  // Check if the objectives field has been filled in (required in the Specification tab)
  if (!existingQuote.objectives || existingQuote.objectives.trim() === "") {
    return {
      success: false,
      error:
        "Please complete the Specification tab first. At minimum, the Objectives field must be filled in before submitting for cost pricing.",
    };
  }

  //update the quote status to 'Sent to Voxd for Cost Pricing'
  await db("quote").where({ id: quoteId }).update({
    status: "Sent to Voxd for Cost Pricing",
  });

  return { success: true };
};

export default saSubmitQuoteForCostPricing;
