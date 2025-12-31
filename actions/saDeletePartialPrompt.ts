"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeletePartialPrompt = async ({
  partialPromptId,
}: {
  partialPromptId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    await db("partialPrompt").delete().where({ id: partialPromptId });
  } catch (error) {
    console.error("Error deleting partial prompt:", error);
    return { success: false, error: "Error deleting partial prompt" };
  }

  return { success: true };
};

export default saDeletePartialPrompt;
