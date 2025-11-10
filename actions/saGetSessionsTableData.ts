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
    .join("user", "session.userId", "user.id")
    .join("userMessage", "session.id", "userMessage.sessionId")
    .join("agent", "session.agentId", "agent.id")
    .groupBy("session.id", "user.id", "agent.id")
    .where((qb) => {
      if (search) {
        qb.where("user.name", "ilike", `%${search}%`);
      }
    });

  if (agentId) {
    base.where("session.agentId", agentId);
  }

  if (userId) {
    base.where("session.userId", userId);
  }

  //if organisation is logging in, restrict to their agents
  if (accessToken?.organisation) {
    base
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .leftJoin(
        "organisationUser",
        "organisation.id",
        "organisationUser.organisationId"
      )
      .where("organisationUser.userId", accessToken!.userId);
  }

  //if partner is logging in, restrict to their agents
  if (accessToken?.partner) {
    base
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("organisation.partnerId", accessToken!.partnerId);
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
      "user.id as userId",
      "user.name",
      "user.number",
      "agent.id as agentId",
      "agent.niceName as agentName"
    )
    .select(
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('MIN("userMessage"."createdAt") as "firstMessageAt"')
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
