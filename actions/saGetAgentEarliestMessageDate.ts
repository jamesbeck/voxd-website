"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetAgentEarliestMessageDate = async ({
  agentId,
}: {
  agentId: string;
}): Promise<string | null> => {
  await verifyAccessToken();

  const result = await db("userMessage")
    .join("session", "userMessage.sessionId", "session.id")
    .join("chatUser", "session.userId", "chatUser.id")
    .where("chatUser.agentId", agentId)
    .min("userMessage.createdAt as earliest")
    .first();

  if (!result?.earliest) return null;

  return new Date(result.earliest).toISOString();
};

export default saGetAgentEarliestMessageDate;
