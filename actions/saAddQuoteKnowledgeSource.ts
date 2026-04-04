"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saAddQuoteKnowledgeSource = async ({
  quoteId,
  knowledgeSourceId,
  otherName,
  otherDescription,
}: {
  quoteId: string;
  knowledgeSourceId?: string;
  otherName?: string;
  otherDescription?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return { success: false, error: "Quote ID is required" };
  }

  if (!knowledgeSourceId && !otherName) {
    return {
      success: false,
      error: "Either a knowledge source or a custom name is required",
    };
  }

  const existingQuote = await db("quote").where({ id: quoteId }).first();
  if (!existingQuote) {
    return { success: false, error: "Quote not found" };
  }

  try {
    const [row] = await db("quoteKnowledgeSource")
      .insert({
        quoteId,
        knowledgeSourceId: knowledgeSourceId || null,
        otherName: otherName || null,
        otherDescription: otherDescription || null,
      })
      .returning("id");

    return { success: true, data: row };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to add knowledge source",
    };
  }
};

export default saAddQuoteKnowledgeSource;
