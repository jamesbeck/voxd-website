"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreateUser = async ({
  name,
  agentId,
  number,
}: {
  name: string;
  agentId: string;
  number?: string;
}): Promise<ServerActionResponse> => {
  //check user number is unique for this agent
  const existingUser = await db("user")
    .select("*")
    .where("agentId", agentId)
    .where("number", number)
    .whereNotNull("number")
    .where("number", "!=", "")
    .first();

  console.log({ existingUser });

  if (existingUser) {
    return {
      success: false,
      error: "User already exists with this number for this agent",
    };
  }

  //create a new user
  const [newUser] = await db("user")
    .insert({ name, agentId, number })
    .returning("id");

  return { success: true, data: newUser };
};

export { saCreateUser };
