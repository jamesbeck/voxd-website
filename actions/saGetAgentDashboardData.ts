"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface DashboardData {
  date: string;
  count: number;
}

const saGetAgentDashboardData = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<DashboardData[]> => {
  await verifyAccessToken();

  const data = await db("userMessage")
    .join("session", "userMessage.sessionId", "session.id")
    .join("chatUser", "session.userId", "chatUser.id")
    .where("chatUser.agentId", agentId)
    .where("userMessage.createdAt", ">=", from)
    .where("userMessage.createdAt", "<=", to)
    .select(
      db.raw(
        'TO_CHAR(DATE("userMessage"."createdAt"), \'YYYY-MM-DD\') as date',
      ),
      db.raw("COUNT(*)::int as count"),
    )
    .groupBy(db.raw('DATE("userMessage"."createdAt")'))
    .orderByRaw('DATE("userMessage"."createdAt") ASC');

  return data.map((row: any) => ({
    date: row.date,
    count: row.count,
  }));
};

export default saGetAgentDashboardData;
