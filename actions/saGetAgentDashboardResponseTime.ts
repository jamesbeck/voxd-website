"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface ResponseTimePerDay {
  date: string;
  avgMs: number;
}

const saGetAgentDashboardResponseTime = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<ResponseTimePerDay[]> => {
  await verifyAccessToken();

  const data = await db("assistantMessage")
    .join("session", "assistantMessage.sessionId", "session.id")
    .join("chatUser", "session.userId", "chatUser.id")
    .where("chatUser.agentId", agentId)
    .where("assistantMessage.createdAt", ">=", from)
    .where("assistantMessage.createdAt", "<=", to)
    .whereNotNull("assistantMessage.responseRequestedAt")
    .whereNotNull("assistantMessage.responseReceivedAt")
    .select(
      db.raw(
        'TO_CHAR(DATE("assistantMessage"."createdAt"), \'YYYY-MM-DD\') as date',
      ),
      db.raw(
        `ROUND(AVG(EXTRACT(EPOCH FROM ("assistantMessage"."responseReceivedAt" - "assistantMessage"."responseRequestedAt")) * 1000)::numeric)::float as "avgMs"`,
      ),
    )
    .groupBy(db.raw('DATE("assistantMessage"."createdAt")'))
    .orderByRaw('DATE("assistantMessage"."createdAt") ASC');

  return data.map((row: any) => ({
    date: row.date,
    avgMs: row.avgMs,
  }));
};

export default saGetAgentDashboardResponseTime;
