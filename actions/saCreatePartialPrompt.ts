"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreatePartialPrompt = async ({
  agentId,
  name,
  text,
}: {
  agentId: string;
  name: string;
  text: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.admin) {
    return {
      success: false,
      error: "Only admin users can create partial prompts.",
    };
  }

  // Check the agent exists
  const agent = await db("agent").where("id", agentId).first();
  if (!agent) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  // Create the partial prompt
  const [newPartialPrompt] = await db("partialPrompt")
    .insert({
      agentId,
      name,
      text,
    })
    .returning("*");

  return {
    success: true,
    data: newPartialPrompt,
  };
};

export { saCreatePartialPrompt };
