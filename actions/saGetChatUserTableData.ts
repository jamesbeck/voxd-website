"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetChatUserTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  organisationId,
  agentId,
}: ServerActionReadParams & {
  organisationId?: string;
  agentId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  //base query
  const base = db("user")
    .leftJoin("session", "user.id", "session.userId")
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .leftJoin("agent", "agent.id", "session.agentId")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .leftJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .groupBy("user.id")
    .where((qb) => {
      if (search) {
        qb.where("user.name", "ilike", `%${search}%`).orWhere(
          "user.number",
          "ilike",
          `%${search}%`
        );
      }
    });

  //filter by organisationId if provided
  if (organisationId) {
    base.where("organisationUser.organisationId", organisationId);
  }

  //filter by agentId if provided
  if (agentId) {
    base.where("agent.id", agentId);
  }

  //if organisation is logged in, restrict to their agents
  if (accessToken?.organisation && !accessToken.admin) {
    base.where("organisationUser.userId", accessToken!.userId);
  }

  //if partner is logged in, restrict to their agents
  if (accessToken?.partner) {
    base.where("organisation.partnerId", accessToken!.partnerId);
  }

  //count query
  const countQuery = base.clone().select("user.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // now select and query what we want for the data and apply pagination
  const dataQuery = base
    .clone()
    .select("user.*")
    .select([
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"'),
      db.raw(`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', "agent"."id",
              'name', "agent"."name",
              'niceName', "agent"."niceName"
            )
          ) FILTER (WHERE "agent"."id" IS NOT NULL),
          '[]'
        ) as agents
      `),
    ])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const users = await dataQuery;

  return {
    success: true,
    data: users,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetChatUserTableData;
