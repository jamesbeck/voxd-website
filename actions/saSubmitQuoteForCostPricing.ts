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

  // Check if the proposal has been generated
  if (
    !existingQuote.generatedIntroduction ||
    !existingQuote.generatedSpecification
  ) {
    return {
      success: false,
      error:
        "Please generate the proposal before submitting for cost pricing. Go to the Specification tab and click 'Save & Generate Proposal', then review the generated content in the Proposal tab.",
    };
  }

  // Check if at least one example conversation exists
  const exampleConversationCount = await db("exampleConversation")
    .where({ quoteId })
    .count("id as count")
    .first();

  const conversationCount =
    parseInt(exampleConversationCount?.count as string) || 0;

  if (conversationCount === 0) {
    return {
      success: false,
      error:
        "Please generate at least one example conversation before submitting for cost pricing. Go to the Example Conversations tab and generate a conversation.",
    };
  }

  //update the quote status to 'Sent to Voxd for Cost Pricing'
  await db("quote").where({ id: quoteId }).update({
    status: "Sent to Voxd for Cost Pricing",
  });

  return { success: true };
};

export default saSubmitQuoteForCostPricing;
