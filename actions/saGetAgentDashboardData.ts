"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface DashboardData {
  date: string;
  count: number;
}

const saGetAgentDashboardData = async ({
  agentId,
}: {
  agentId: string;
}): Promise<DashboardData[]> => {
  await verifyAccessToken();

  // Get user messages per day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const data = await db("userMessage")
    .join("session", "userMessage.sessionId", "session.id")
    .where("session.agentId", agentId)
    .where("userMessage.createdAt", ">=", thirtyDaysAgo)
    .select(
      db.raw(
        'TO_CHAR(DATE("userMessage"."createdAt"), \'YYYY-MM-DD\') as date'
      ),
      db.raw("COUNT(*)::int as count")
    )
    .groupBy(db.raw('DATE("userMessage"."createdAt")'))
    .orderByRaw('DATE("userMessage"."createdAt") ASC');

  return data.map((row: any) => ({
    date: row.date,
    count: row.count,
  }));
};

export default saGetAgentDashboardData;
