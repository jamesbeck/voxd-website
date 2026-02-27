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

  //update the agent - only include fields that were explicitly provided
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (niceName !== undefined) updateData.niceName = niceName;
  if (organisationId !== undefined)
    updateData.organisationId = organisationId || null;
  if (phoneNumberId !== undefined)
    updateData.phoneNumberId = phoneNumberId || null;
  if (openAiApiKey !== undefined) updateData.openAiApiKey = openAiApiKey;
  if (modelId !== undefined) updateData.modelId = modelId || null;
  if (targetMessageLengthCharacters !== undefined)
    updateData.targetMessageLengthCharacters =
      targetMessageLengthCharacters ?? null;
  if (maxMessageHistory !== undefined)
    updateData.maxMessageHistory = maxMessageHistory ?? null;
  if (autoCloseSessionAfterSeconds !== undefined)
    updateData.autoCloseSessionAfterSeconds =
      autoCloseSessionAfterSeconds ?? null;

  if (Object.keys(updateData).length > 0) {
    await db("agent").where({ id: agentId }).update(updateData);
  }

  return { success: true };
};

export default saUpdateAgent;
