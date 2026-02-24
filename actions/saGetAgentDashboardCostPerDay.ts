"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface CostPerDay {
  date: string;
  cost: number;
}

const saGetAgentDashboardCostPerDay = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<CostPerDay[]> => {
  await verifyAccessToken();

  const data = await db("assistantMessage")
    .join("session", "assistantMessage.sessionId", "session.id")
    .join("chatUser", "session.userId", "chatUser.id")
    .where("chatUser.agentId", agentId)
    .where("assistantMessage.createdAt", ">=", from)
    .where("assistantMessage.createdAt", "<=", to)
    .select(
      db.raw(
        'TO_CHAR(DATE("assistantMessage"."createdAt"), \'YYYY-MM-DD\') as date',
      ),
      db.raw(
        `SUM(COALESCE("assistantMessage"."inputCost", 0) + COALESCE("assistantMessage"."outputCost", 0))::float as cost`,
      ),
    )
    .groupBy(db.raw('DATE("assistantMessage"."createdAt")'))
    .orderByRaw('DATE("assistantMessage"."createdAt") ASC');

  return data.map((row: any) => ({
    date: row.date,
    cost: row.cost,
  }));
};

export default saGetAgentDashboardCostPerDay;
