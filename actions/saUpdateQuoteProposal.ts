"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateQuoteProposal = async ({
  quoteId,
  proposalPersonalMessage,
  generatedProposalIntroduction,
  generatedSpecification,
  proposalHideSections,
}: {
  quoteId: string;
  proposalPersonalMessage?: string;
  generatedProposalIntroduction?: string;
  generatedSpecification?: string;
  proposalHideSections?: string[];
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  const existingQuote = await db("quote")
    .select("id")
    .where({ id: quoteId })
    .first();

  if (!existingQuote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Build update object with only provided values
  const updateData: Record<string, any> = {};
  if (proposalPersonalMessage !== undefined)
    updateData.proposalPersonalMessage = proposalPersonalMessage;
  if (generatedProposalIntroduction !== undefined)
    updateData.generatedProposalIntroduction = generatedProposalIntroduction;
  if (generatedSpecification !== undefined)
    updateData.generatedSpecification = generatedSpecification;
  if (proposalHideSections !== undefined)
    updateData.proposalHideSections = proposalHideSections;

  if (Object.keys(updateData).length === 0) {
    return { success: true }; // Nothing to update
  }

  await db("quote").where({ id: quoteId }).update(updateData);

  return { success: true };
};

export default saUpdateQuoteProposal;
