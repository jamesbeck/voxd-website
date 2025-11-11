"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateQuote = async ({
  quoteId,
  title,
  customerId,
  specification,
}: {
  quoteId: string;
  title?: string;
  customerId?: string;
  specification?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  //find the existing partner
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

  //update the quote
  await db("quote").where({ id: quoteId }).update({
    title,
    customerId,
    specification,
  });

  return { success: true };
};

export default saUpdateQuote;
