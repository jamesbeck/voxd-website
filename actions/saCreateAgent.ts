"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreateAgent = async ({
  name,
  niceName,
  organisationId,
  phoneNumberId,
  providerApiKeyId,
  modelId,
  codeDirectory,
  targetMessageLengthCharacters,
  maxMessageHistory,
  autoCloseSessionAfterSeconds,
}: {
  name: string;
  niceName: string;
  organisationId?: string;
  phoneNumberId?: string;
  providerApiKeyId?: string;
  modelId?: string;
  codeDirectory?: string;
  targetMessageLengthCharacters?: number;
  maxMessageHistory?: number;
  autoCloseSessionAfterSeconds?: number;
}): Promise<ServerActionResponse> => {
  //check agent name is unique
  const existingAgentByName = await db("agent")
    .select("*")
    .where(function () {
      this.where("name", name);
    })
    .first();

  if (existingAgentByName) {
    return {
      success: false,
      error: `Agent already exists with name '${name}'`,
    };
  }

  //create a new agent
  const [newAgent] = await db("agent")
    .insert({
      name,
      niceName,
      organisationId: organisationId || null,
      phoneNumberId: phoneNumberId || null,
      providerApiKeyId: providerApiKeyId || null,
      modelId: modelId || null,
      codeDirectory: codeDirectory || null,
      targetMessageLengthCharacters: targetMessageLengthCharacters ?? 130,
      maxMessageHistory: maxMessageHistory ?? 50,
      autoCloseSessionAfterSeconds: autoCloseSessionAfterSeconds ?? 86400,
    })
    .returning("*");

  return {
    success: true,
    data: newAgent,
  };
};

export { saCreateAgent };
