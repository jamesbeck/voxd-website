"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export type UserAgent = {
  id: string;
  name: string;
};

const saGetUserAgents = async (): Promise<UserAgent[]> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.organisationId) {
    return [];
  }

  const agents = await db("agent")
    .select("agent.id", "agent.name")
    .where("agent.organisationId", accessToken.organisationId)
    .orderBy("agent.name", "asc");

  return agents;
};

export default saGetUserAgents;
