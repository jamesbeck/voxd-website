"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
// import { openai } from "@ai-sdk/openai";
// import { generateObject } from "ai";
// import { z } from "zod";

const saUpdateQuote = async ({
  quoteId,
  specification,
}: {
  quoteId: string;
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
    specification,
  });

  // //apraise the specification using AI
  // const { object } = await generateObject({
  //   model: openai("gpt-5-nano"),
  //   schema: z.object({
  //     questions: z
  //       .string()
  //       .array()
  //       .describe("Questions that need answering to provide an accurate quote.")
  //       .length(5),
  //   }),
  //   prompt: `
  //       Look at the belwow specification for a WhatsApp powered ChatBot. The specification has been written by a customer.

  //       What's missing from the specification that would be needed to provide an accurate quote for the implementation of the chat bot?

  //       Only think of the top 5 most important questions that will help us provide an accurate quote.

  //       This is a high level specification, do not ask for loads of detail.

  //       The bot will be built on a comprehensive platform and you cna assume it has all the standard features you would expect from a WhatsApp chatbot / AI platform.

  //       Do not mention:
  //       - Human handover or other channels
  //       - Non price effecting factors, only focus on things that will effect the price
  //       - SLA's
  //       - Updates or future changes
  //       - Analytics / reporting
  //       - Running costs, hosting, backups, etc.

  //       The quote is titled "${existingQuote.title}", it's for a company called "${existingQuote.organisationName}"

  //       Specification:
  //       ${specification}
  //   `,
  // });

  // console.log(object);

  return { success: true };
};

export default saUpdateQuote;
