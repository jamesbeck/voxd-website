"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const saUpdatePartialPrompt = async ({
  partialPromptId,
  name,
  text,
}: {
  partialPromptId: string;
  name?: string;
  text?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

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

  // Log partial prompt update
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Partial Prompt Updated",
    description: `Partial prompt "${
      name || existingPartialPrompt.name
    }" updated`,
    agentId: existingPartialPrompt.agentId,
    data: {
      partialPromptId,
      before: {
        name: existingPartialPrompt.name,
        text: existingPartialPrompt.text,
      },
      after: {
        name: name ?? existingPartialPrompt.name,
        text: text ?? existingPartialPrompt.text,
      },
    },
  });

  return { success: true };
};

export default saUpdatePartialPrompt;
