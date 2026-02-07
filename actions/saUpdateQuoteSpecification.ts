"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateQuote = async ({
  quoteId,
  objectives,
  dataSourcesAndIntegrations,
  otherNotes,
}: {
  quoteId: string;
  objectives?: string;
  dataSourcesAndIntegrations?: string;
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

  // Only allow editing specification fields when the quote is in Draft or Concept Sent to Client status
  if (
    existingQuote.status !== "Draft" &&
    existingQuote.status !== "Concept Sent to Client"
  ) {
    return {
      success: false,
      error:
        "Specification can only be edited when the quote is in 'Draft' or 'Concept Sent to Client' status",
    };
  }

  //update the quote
  await db("quote").where({ id: quoteId }).update({
    objectives,
    dataSourcesAndIntegrations,
    otherNotes,
  });

  return { success: true };
};

export default saUpdateQuote;
