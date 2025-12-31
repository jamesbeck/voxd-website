"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdatePartialPrompt = async ({
  partialPromptId,
  name,
  text,
}: {
  partialPromptId: string;
  name?: string;
  text?: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  if (!partialPromptId) {
    return {
      success: false,
      error: "Partial Prompt ID is required",
    };
  }

  const existingPartialPrompt = await db("partialPrompt")
    .select("*")
    .where({ id: partialPromptId })
    .first();

  if (!existingPartialPrompt) {
    return {
      success: false,
      error: "Partial prompt not found",
    };
  }

  await db("partialPrompt").where({ id: partialPromptId }).update({
    name,
    text,
    updatedAt: db.fn.now(),
  });

  return { success: true };
};

export default saUpdatePartialPrompt;
