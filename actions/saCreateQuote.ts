"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { z, treeifyError } from "zod";

// Validation schema for creating a quote
const createQuoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  organisationId: z.string().trim().min(1, "Organisation ID is required"),
});

const saCreateQuote = async (input: {
  title: string;
  organisationId: string;
}): Promise<ServerActionResponse> => {
  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    console.log("Validation errors:", treeifyError(parsed.error));

    return {
      success: false,
      error: "aaahhhh", //treeifyError(parsed.error),
    };
  }

  const { title, organisationId } = parsed.data;

  // Insert new quote (include organisationId if column exists; adjust as needed)
  try {
    const [newQuote] = await db("quote")
      .insert({ title, organisationId })
      .returning("id");

    return { success: true, data: newQuote };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create quote",
    };
  }
};

export { saCreateQuote };
