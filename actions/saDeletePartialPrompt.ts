"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeletePartialPrompt = async ({
  partialPromptId,
}: {
  partialPromptId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.admin) {
    return {
      success: false,
      error: "Only admin users can delete partial prompts.",
    };
  }

  try {
    await db("partialPrompt").delete().where({ id: partialPromptId });
  } catch (error) {
    console.error("Error deleting partial prompt:", error);
    return { success: false, error: "Error deleting partial prompt" };
  }

  return { success: true };
};

export default saDeletePartialPrompt;
