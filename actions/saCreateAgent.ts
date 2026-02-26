"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreateAgent = async ({
  name,
  niceName,
  openAiApiKey,
}: {
  name: string;
  niceName: string;
  openAiApiKey?: string;
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
      openAiApiKey,
      targetMessageLengthCharacters: 130,
      maxMessageHistory: 50,
      autoCloseSessionAfterSeconds: 86400,
    })
    .returning("*");

  return {
    success: true,
    data: newAgent,
  };
};

export { saCreateAgent };
