"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

interface ModelBreakdown {
  modelId: string;
  modelName: string;
  provider: string;
  avgCostPerSession: number;
  sessionCount: number;
}

interface UsageStats {
  avgInputTokens: number;
  avgOutputTokens: number;
  avgCostPerSession: number;
  totalCost: number;
  totalSessions: number;
  modelBreakdown: ModelBreakdown[];
}

export default async function saGetAgentUsageStats(agentId: string): Promise<{
  success: boolean;
  data?: UsageStats;
  error?: string;
}> {
  try {
    await verifyAccessToken();

    // Query to get average token usage and costs per session
    // First aggregate by session, then calculate averages across sessions
    const sessionAggregates = db("assistantMessage")
      .join("session", "assistantMessage.sessionId", "session.id")
      .join("chatUser", "session.userId", "chatUser.id")
      .where("chatUser.agentId", agentId)
      .whereNotNull("assistantMessage.inputTokens")
      .whereNotNull("assistantMessage.outputTokens")
      .groupBy("session.id")
      .select(
        "session.id",
        db.raw('SUM("inputTokens") as session_input_tokens'),
        db.raw('SUM("outputTokens") as session_output_tokens'),
        db.raw(
          'SUM(COALESCE("inputCost", 0) + COALESCE("outputCost", 0)) as session_total_cost'
        )
      );

    const result = await db
      .from(sessionAggregates.as("session_stats"))
      .select(
        db.raw("AVG(session_input_tokens)::numeric as avg_input_tokens"),
        db.raw("AVG(session_output_tokens)::numeric as avg_output_tokens"),
        db.raw("AVG(session_total_cost)::numeric as avg_cost_per_session"),
        db.raw("SUM(session_total_cost)::numeric as total_cost"),
        db.raw("COUNT(*)::integer as total_sessions")
      )
      .first();

    // Get cost breakdown by model (using first message's model in each session)
    const modelBreakdownQuery = await db.raw(
      `
      WITH first_message_per_session AS (
        SELECT DISTINCT ON (s.id)
          s.id as session_id,
          am."modelId",
          m.model as model_name,
          p.name as provider
        FROM session s
        JOIN "chatUser" cu ON s."userId" = cu.id
        JOIN "assistantMessage" am ON am."sessionId" = s.id
        LEFT JOIN model m ON am."modelId" = m.id
        LEFT JOIN provider p ON m."providerId" = p.id
        WHERE cu."agentId" = ?
          AND am."inputTokens" IS NOT NULL
          AND am."outputTokens" IS NOT NULL
        ORDER BY s.id, am."createdAt" ASC
      ),
      session_costs AS (
        SELECT
          s.id as session_id,
          SUM(COALESCE(am."inputCost", 0) + COALESCE(am."outputCost", 0)) as session_cost
        FROM session s
        JOIN "chatUser" cu ON s."userId" = cu.id
        JOIN "assistantMessage" am ON am."sessionId" = s.id
        WHERE cu."agentId" = ?
          AND am."inputTokens" IS NOT NULL
          AND am."outputTokens" IS NOT NULL
        GROUP BY s.id
      )
      SELECT
        fms."modelId",
        fms.model_name,
        fms.provider,
        AVG(sc.session_cost)::numeric as avg_cost_per_session,
        COUNT(*)::integer as session_count
      FROM first_message_per_session fms
      JOIN session_costs sc ON fms.session_id = sc.session_id
      GROUP BY fms."modelId", fms.model_name, fms.provider
      ORDER BY avg_cost_per_session DESC
    `,
      [agentId, agentId]
    );

    const modelBreakdown: ModelBreakdown[] = modelBreakdownQuery.rows.map(
      (row: any) => ({
        modelId: row.modelId,
        modelName: row.model_name || "Unknown",
        provider: row.provider || "Unknown",
        avgCostPerSession: parseFloat(row.avg_cost_per_session || "0"),
        sessionCount: row.session_count || 0,
      })
    );

    const stats: UsageStats = {
      avgInputTokens: parseFloat(result.avg_input_tokens || "0"),
      avgOutputTokens: parseFloat(result.avg_output_tokens || "0"),
      avgCostPerSession: parseFloat(result.avg_cost_per_session || "0"),
      totalCost: parseFloat(result.total_cost || "0"),
      totalSessions: result.total_sessions || 0,
      modelBreakdown,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching agent usage stats:", error);
    return { success: false, error: "Failed to fetch usage statistics" };
  }
}
