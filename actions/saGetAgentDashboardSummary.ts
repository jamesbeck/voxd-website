"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface SummaryStats {
  totalUniqueUsers: number;
  newUsers: number;
  totalSessions: number;
  avgResponseTimeMs: number | null;
  totalCost: number;
  errorRate: number;
  totalMessages: number;
}

const saGetAgentDashboardSummary = async ({
  agentId,
  from,
  to,
}: {
  agentId: string;
  from: string;
  to: string;
}): Promise<SummaryStats> => {
  await verifyAccessToken();

  const [
    uniqueUsersResult,
    newUsersResult,
    sessionsResult,
    responseTimeResult,
    costResult,
    errorResult,
  ] = await Promise.all([
    // Total unique users who sent messages in the period
    db("userMessage")
      .join("session", "userMessage.sessionId", "session.id")
      .join("chatUser", "session.userId", "chatUser.id")
      .where("chatUser.agentId", agentId)
      .where("userMessage.createdAt", ">=", from)
      .where("userMessage.createdAt", "<=", to)
      .countDistinct("chatUser.id as count")
      .first(),

    // New users — users whose first-ever message falls within the period
    db.raw(
      `
      SELECT COUNT(*)::int as count
      FROM (
        SELECT "chatUser"."id",
               MIN("userMessage"."createdAt") as "firstMessage"
        FROM "chatUser"
        JOIN "session" ON "session"."userId" = "chatUser"."id"
        JOIN "userMessage" ON "userMessage"."sessionId" = "session"."id"
        WHERE "chatUser"."agentId" = ?
        GROUP BY "chatUser"."id"
        HAVING MIN("userMessage"."createdAt") >= ? AND MIN("userMessage"."createdAt") <= ?
      ) sub
      `,
      [agentId, from, to],
    ),

    // Total sessions created in the period
    db("session")
      .join("chatUser", "session.userId", "chatUser.id")
      .where("chatUser.agentId", agentId)
      .where("session.createdAt", ">=", from)
      .where("session.createdAt", "<=", to)
      .count("session.id as count")
      .first(),

    // Average response time (ms)
    db("assistantMessage")
      .join("session", "assistantMessage.sessionId", "session.id")
      .join("chatUser", "session.userId", "chatUser.id")
      .where("chatUser.agentId", agentId)
      .where("assistantMessage.createdAt", ">=", from)
      .where("assistantMessage.createdAt", "<=", to)
      .whereNotNull("assistantMessage.responseRequestedAt")
      .whereNotNull("assistantMessage.responseReceivedAt")
      .select(
        db.raw(
          `AVG(EXTRACT(EPOCH FROM ("assistantMessage"."responseReceivedAt" - "assistantMessage"."responseRequestedAt")) * 1000)::float as "avgMs"`,
        ),
      )
      .first(),

    // Total cost
    db("assistantMessage")
      .join("session", "assistantMessage.sessionId", "session.id")
      .join("chatUser", "session.userId", "chatUser.id")
      .where("chatUser.agentId", agentId)
      .where("assistantMessage.createdAt", ">=", from)
      .where("assistantMessage.createdAt", "<=", to)
      .select(
        db.raw(
          `COALESCE(SUM(COALESCE("assistantMessage"."inputCost", 0) + COALESCE("assistantMessage"."outputCost", 0)), 0)::float as "totalCost"`,
        ),
      )
      .first(),

    // Error rate
    db("userMessage")
      .join("session", "userMessage.sessionId", "session.id")
      .join("chatUser", "session.userId", "chatUser.id")
      .where("chatUser.agentId", agentId)
      .where("userMessage.createdAt", ">=", from)
      .where("userMessage.createdAt", "<=", to)
      .select(
        db.raw("COUNT(*)::int as total"),
        db.raw(
          `COUNT(*) FILTER (WHERE "userMessage"."error" IS NOT NULL)::int as errors`,
        ),
      )
      .first(),
  ]);

  return {
    totalUniqueUsers: parseInt(uniqueUsersResult?.count as string) || 0,
    newUsers: newUsersResult.rows[0]?.count || 0,
    totalSessions: parseInt(sessionsResult?.count as string) || 0,
    avgResponseTimeMs: responseTimeResult?.avgMs ?? null,
    totalCost: costResult?.totalCost || 0,
    errorRate:
      errorResult?.total > 0
        ? (errorResult.errors / errorResult.total) * 100
        : 0,
    totalMessages: errorResult?.total || 0,
  };
};

export default saGetAgentDashboardSummary;
