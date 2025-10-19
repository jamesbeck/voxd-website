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
  //check agent name and openAiApiKey is unique
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

  const existingAgentByOpenAiApiKey = await db("agent")
    .where(function (qb) {
      qb.where("openAiApiKey", openAiApiKey);
      qb.whereNotNull("openAiApiKey").andWhere("openAiApiKey", "!=", "");
    })
    .first();

  if (existingAgentByOpenAiApiKey) {
    return {
      success: false,
      error: `Agent already exists with OpenAI API Key '${openAiApiKey}'`,
    };
  }

  //create a new agent
  const [newAgent] = await db("agent")
    .insert({ name, niceName, openAiApiKey })
    .returning("*");

  return {
    success: true,
    data: newAgent,
  };
};

export { saCreateAgent };
