"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface HourlyData {
  hour: number;
  avgCount: number;
}

const saGetAgentDashboardHourlyData = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<HourlyData[]> => {
  await verifyAccessToken();

  const data = await db.raw(
    `
    SELECT hour, ROUND(AVG(count)::numeric, 1)::float as "avgCount"
    FROM (
      SELECT
        EXTRACT(HOUR FROM "userMessage"."createdAt")::int as hour,
        DATE("userMessage"."createdAt") as day,
        COUNT(*)::int as count
      FROM "userMessage"
      JOIN "session" ON "userMessage"."sessionId" = "session"."id"
      JOIN "chatUser" ON "session"."userId" = "chatUser"."id"
      WHERE "chatUser"."agentId" = ?
        AND "userMessage"."createdAt" >= ?
        AND "userMessage"."createdAt" <= ?
      GROUP BY hour, day
    ) sub
    GROUP BY hour
    ORDER BY hour
    `,
    [agentId, from, to],
  );

  return data.rows.map((row: any) => ({
    hour: row.hour,
    avgCount: row.avgCount,
  }));
};

export default saGetAgentDashboardHourlyData;
