"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import saGenerateQuoteProposal from "./saGenerateQuoteProposal";

const saUpdateQuote = async ({
  quoteId,
  background,
  objectives,
  dataSources,
  integrationRequirements,
  otherNotes,
}: {
  quoteId: string;
  background?: string;
  objectives?: string;
  dataSources?: string;
  integrationRequirements?: string;
  otherNotes?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  //find the existing partner
  const existingQuote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .select("quote.*", "organisation.name as organisationName")
    .where({ "quote.id": quoteId })
    .first();

  if (!existingQuote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  //update the quote
  await db("quote").where({ id: quoteId }).update({
    background,
    objectives,
    dataSources,
    integrationRequirements,
    otherNotes,
  });

  // Generate the proposal using AI (don't block on errors)
  try {
    await saGenerateQuoteProposal({ quoteId });
  } catch (error) {
    console.error("Error generating proposal:", error);
    // Don't fail the whole operation if AI generation fails
  }

  return { success: true };
};

export default saUpdateQuote;
