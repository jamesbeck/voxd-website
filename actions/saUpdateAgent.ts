"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateAgent = async ({
  agentId,
  name,
  niceName,
  organisationId,
  phoneNumberId,
  openAiApiKey,
}: {
  agentId: string;
  name?: string;
  niceName?: string;
  organisationId?: string;
  phoneNumberId?: string;
  openAiApiKey?: string;
}): Promise<ServerActionResponse> => {
  if (!agentId) {
    return {
      success: false,
      error: "Agent ID is required",
    };
  }

  //find the existing partner
  const existingAgent = await db("agent")
    .select("*")
    .where({ id: agentId })
    .first();

  if (!existingAgent) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  //update the agent
  await db("agent")
    .where({ id: agentId })
    .update({
      name,
      niceName,
      organisationId: organisationId || null,
      phoneNumberId: phoneNumberId || null,
      openAiApiKey,
    });

  return { success: true };
};

export default saUpdateAgent;
