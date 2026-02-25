"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetSessionsTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  agentId,
  userId,
}: ServerActionReadParams<{
  agentId?: string;
  userId?: string;
}>): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("session")
    .join("chatUser", "session.userId", "chatUser.id")
    .join("userMessage", "session.id", "userMessage.sessionId")
    .join("agent", "chatUser.agentId", "agent.id")
    .groupBy("session.id", "chatUser.id", "agent.id")
    .where((qb) => {
      if (search) {
        qb.where("chatUser.name", "ilike", `%${search}%`);
      }
    });

  if (agentId) {
    base.where("chatUser.agentId", agentId);
  }

  if (userId) {
    base.where("session.userId", userId);
  }

  //if organisation is logging in, restrict to their agents
  if (!accessToken.partner && !accessToken.superAdmin) {
    base.where("agent.organisationId", accessToken.organisationId);
  }

  //if partner is logging in, restrict to their agents
  if (accessToken?.partner && !accessToken.superAdmin) {
    base
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("organisation.partnerId", accessToken!.partnerId);
  }

  //only super admin users can see development sessions
  if (!accessToken.superAdmin) {
    base.where("session.sessionType", "!=", "development");
  }

  //count query
  const countQuery = base.clone().select("session.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const sessions = await base
    .clone()
    .select(
      "session.id",
      "session.sessionType",
      "session.closedAt",
      "session.closedReason",
      "session.paused",
      "session.platform",
      "chatUser.id as userId",
      "chatUser.name",
      "chatUser.number",
      "agent.id as agentId",
      "agent.niceName as agentName"
    )
    .select(
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('MIN("userMessage"."createdAt") as "firstMessageAt"'),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."inputTokens") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS INTEGER) as "totalinputTokens"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."outputTokens") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS INTEGER) as "totaloutputTokens"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."inputCost") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS FLOAT) as "totalPromptCost"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."outputCost") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS FLOAT) as "totalCompletionCost"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."inputCost" + "assistantMessage"."outputCost") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS FLOAT) as "totalCost"'
      )
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: sessions,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetSessionsTableData;
