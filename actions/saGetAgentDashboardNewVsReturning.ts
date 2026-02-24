"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface NewVsReturningPerDay {
  date: string;
  newUsers: number;
  returningUsers: number;
}

const saGetAgentDashboardNewVsReturning = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<NewVsReturningPerDay[]> => {
  await verifyAccessToken();

  // For each day in the range, count how many distinct users messaging that day
  // are "new" (first-ever message is on that day) vs "returning"
  const data = await db.raw(
    `
    WITH user_first_message AS (
      SELECT "chatUser"."id" as "userId",
             MIN(DATE("userMessage"."createdAt")) as "firstDate"
      FROM "chatUser"
      JOIN "session" ON "session"."userId" = "chatUser"."id"
      JOIN "userMessage" ON "userMessage"."sessionId" = "session"."id"
      WHERE "chatUser"."agentId" = ?
      GROUP BY "chatUser"."id"
    ),
    daily_users AS (
      SELECT DISTINCT
        DATE("userMessage"."createdAt") as day,
        "chatUser"."id" as "userId"
      FROM "userMessage"
      JOIN "session" ON "userMessage"."sessionId" = "session"."id"
      JOIN "chatUser" ON "session"."userId" = "chatUser"."id"
      WHERE "chatUser"."agentId" = ?
        AND "userMessage"."createdAt" >= ?
        AND "userMessage"."createdAt" <= ?
    )
    SELECT
      TO_CHAR(du.day, 'YYYY-MM-DD') as date,
      COUNT(*) FILTER (WHERE ufm."firstDate" = du.day)::int as "newUsers",
      COUNT(*) FILTER (WHERE ufm."firstDate" < du.day)::int as "returningUsers"
    FROM daily_users du
    JOIN user_first_message ufm ON ufm."userId" = du."userId"
    GROUP BY du.day
    ORDER BY du.day ASC
    `,
    [agentId, agentId, from, to],
  );

  return data.rows.map((row: any) => ({
    date: row.date,
    newUsers: row.newUsers,
    returningUsers: row.returningUsers,
  }));
};

export default saGetAgentDashboardNewVsReturning;
