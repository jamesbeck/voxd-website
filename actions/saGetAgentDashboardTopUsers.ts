"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface TopUser {
  userId: string;
  name: string | null;
  number: string | null;
  messageCount: number;
  sessionCount: number;
}

const saGetAgentDashboardTopUsers = async ({
  agentId,
  from,
  to,
  limit = 10,
}: {
  agentId: string;
  from: string;
  to: string;
  limit?: number;
}): Promise<TopUser[]> => {
  await verifyAccessToken();

  const data = await db("userMessage")
    .join("session", "userMessage.sessionId", "session.id")
    .join("chatUser", "session.userId", "chatUser.id")
    .where("chatUser.agentId", agentId)
    .where("userMessage.createdAt", ">=", from)
    .where("userMessage.createdAt", "<=", to)
    .select(
      "chatUser.id as userId",
      "chatUser.name",
      "chatUser.number",
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"'),
    )
    .groupBy("chatUser.id", "chatUser.name", "chatUser.number")
    .orderByRaw('"messageCount" DESC')
    .limit(limit);

  return data.map((row: any) => ({
    userId: row.userId,
    name: row.name,
    number: row.number,
    messageCount: row.messageCount,
    sessionCount: row.sessionCount,
  }));
};

export default saGetAgentDashboardTopUsers;
