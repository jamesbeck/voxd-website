"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface SessionsPerDay {
  date: string;
  count: number;
}

const saGetAgentDashboardSessionsPerDay = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<SessionsPerDay[]> => {
  await verifyAccessToken();

  const data = await db("session")
    .join("chatUser", "session.userId", "chatUser.id")
    .where("chatUser.agentId", agentId)
    .where("session.createdAt", ">=", from)
    .where("session.createdAt", "<=", to)
    .select(
      db.raw('TO_CHAR(DATE("session"."createdAt"), \'YYYY-MM-DD\') as date'),
      db.raw("COUNT(*)::int as count"),
    )
    .groupBy(db.raw('DATE("session"."createdAt")'))
    .orderByRaw('DATE("session"."createdAt") ASC');

  return data.map((row: any) => ({
    date: row.date,
    count: row.count,
  }));
};

export default saGetAgentDashboardSessionsPerDay;
