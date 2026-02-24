"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface WeekdayData {
  dayOfWeek: number;
  dayName: string;
  avgCount: number;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const saGetAgentDashboardWeekdayData = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<WeekdayData[]> => {
  await verifyAccessToken();

  const data = await db.raw(
    `
    SELECT dow, ROUND(AVG(count)::numeric, 1)::float as "avgCount"
    FROM (
      SELECT
        EXTRACT(DOW FROM "userMessage"."createdAt")::int as dow,
        DATE("userMessage"."createdAt") as day,
        COUNT(*)::int as count
      FROM "userMessage"
      JOIN "session" ON "userMessage"."sessionId" = "session"."id"
      JOIN "chatUser" ON "session"."userId" = "chatUser"."id"
      WHERE "chatUser"."agentId" = ?
        AND "userMessage"."createdAt" >= ?
        AND "userMessage"."createdAt" <= ?
      GROUP BY dow, day
    ) sub
    GROUP BY dow
    ORDER BY dow
    `,
    [agentId, from, to],
  );

  return data.rows.map((row: any) => ({
    dayOfWeek: row.dow,
    dayName: DAY_NAMES[row.dow],
    avgCount: row.avgCount,
  }));
};

export default saGetAgentDashboardWeekdayData;
