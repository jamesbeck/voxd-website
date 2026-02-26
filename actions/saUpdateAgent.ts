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
  modelId,
  targetMessageLengthCharacters,
  maxMessageHistory,
  autoCloseSessionAfterSeconds,
}: {
  agentId: string;
  name?: string;
  niceName?: string;
  organisationId?: string;
  phoneNumberId?: string;
  openAiApiKey?: string;
  modelId?: string;
  targetMessageLengthCharacters?: number;
  maxMessageHistory?: number;
  autoCloseSessionAfterSeconds?: number;
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
      modelId: modelId || null,
      targetMessageLengthCharacters: targetMessageLengthCharacters ?? null,
      maxMessageHistory: maxMessageHistory ?? null,
      autoCloseSessionAfterSeconds: autoCloseSessionAfterSeconds ?? null,
    });

  return { success: true };
};

export default saUpdateAgent;
