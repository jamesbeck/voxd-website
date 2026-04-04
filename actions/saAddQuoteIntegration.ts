"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saAddQuoteIntegration = async ({
  quoteId,
  integrationId,
  otherName,
  otherDescription,
}: {
  quoteId: string;
  integrationId?: string;
  otherName?: string;
  otherDescription?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return { success: false, error: "Quote ID is required" };
  }

  if (!integrationId && !otherName) {
    return {
      success: false,
      error: "Either an integration or a custom name is required",
    };
  }

  const existingQuote = await db("quote").where({ id: quoteId }).first();
  if (!existingQuote) {
    return { success: false, error: "Quote not found" };
  }

  try {
    const [row] = await db("quoteIntegration")
      .insert({
        quoteId,
        integrationId: integrationId || null,
        otherName: otherName || null,
        otherDescription: otherDescription || null,
      })
      .returning("id");

    return { success: true, data: row };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to add integration",
    };
  }
};

export default saAddQuoteIntegration;
