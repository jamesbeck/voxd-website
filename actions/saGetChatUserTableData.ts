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

  // Helper to build access-restricted user query
  // Users are now scoped to agents directly (user.agentId)
  const buildAccessRestrictedUserQuery = () => {
    const subquery = db("user")
      .leftJoin("agent", "user.agentId", "agent.id")
      .leftJoin("organisation", "agent.organisationId", "organisation.id");

    if (organisationId) {
      subquery.where("organisation.id", organisationId);
    }
    if (agentId) {
      subquery.where("agent.id", agentId);
    }
    if (!accessToken.partner && !accessToken.admin) {
      subquery.whereExists(function (this: any) {
        this.select(db.raw(1))
          .from("organisationUser")
          .whereRaw('"organisationUser"."organisationId" = "organisation"."id"')
          .where("organisationUser.adminUserId", accessToken!.adminUserId);
      });
    }
    if (accessToken?.partner && !accessToken.admin) {
      subquery.where("organisation.partnerId", accessToken!.partnerId);
    }

    return subquery;
  };

  // Helper to build session query for a user (sessions no longer have agentId)
  const buildSessionQueryForUser = () => {
    const subquery = db("session")
      .leftJoin("user as sessionUser", "session.userId", "sessionUser.id")
      .leftJoin("agent", "sessionUser.agentId", "agent.id")
      .leftJoin("organisation", "agent.organisationId", "organisation.id");

    // Only admin can see development sessions
    if (!accessToken.admin) {
      subquery.where("session.sessionType", "!=", "development");
    }

    return subquery;
  };

  // Session count subquery
  const sessionCountSubquery = buildSessionQueryForUser()
    .clone()
    .select(db.raw('COUNT(DISTINCT "session"."id")'))
    .whereRaw('"session"."userId" = "user"."id"');

  // Message count subquery
  const messageCountSubquery = buildSessionQueryForUser()
    .clone()
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select(db.raw('COUNT("userMessage"."id")'))
    .whereRaw('"session"."userId" = "user"."id"');

  // Last message subquery
  const lastMessageSubquery = buildSessionQueryForUser()
    .clone()
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select(db.raw('MAX("userMessage"."createdAt")'))
    .whereRaw('"session"."userId" = "user"."id"');

  // Cost subquery - now uses user.agentId instead of session.agentId
  const costSubquery = db("assistantMessage")
    .select(
      db.raw(
        'SUM("assistantMessage"."promptTokens" * "model"."inputTokenCost" + "assistantMessage"."completionTokens" * "model"."outputTokenCost") / 1000000.0'
      )
    )
    .leftJoin("model", "assistantMessage.modelId", "model.id")
    .leftJoin("session", "assistantMessage.sessionId", "session.id")
    .leftJoin("user as costUser", "session.userId", "costUser.id")
    .leftJoin("agent as costAgent", "costUser.agentId", "costAgent.id")
    .leftJoin(
      "organisation as costOrg",
      "costAgent.organisationId",
      "costOrg.id"
    )
    .whereRaw('"session"."userId" = "user"."id"')
    .modify((qb: any) => {
      if (organisationId) {
        qb.where("costOrg.id", organisationId);
      }
      if (agentId) {
        qb.where("costAgent.id", agentId);
      }
      if (!accessToken.partner && !accessToken.admin) {
        qb.whereExists(function (this: any) {
          this.select(db.raw(1))
            .from("organisationUser")
            .whereRaw('"organisationUser"."organisationId" = "costOrg"."id"')
            .where("organisationUser.adminUserId", accessToken!.adminUserId);
        });
      }
      if (accessToken?.partner && !accessToken.admin) {
        qb.where("costOrg.partnerId", accessToken!.partnerId);
      }
      // Only admin can see development sessions
      if (!accessToken.admin) {
        qb.where("session.sessionType", "!=", "development");
      }
    });

  // Base query - filter users by access
  const base = buildAccessRestrictedUserQuery().clone().select("user.*");

  if (search) {
    base.where((qb) => {
      qb.where("user.name", "ilike", `%${search}%`).orWhere(
        "user.number",
        "ilike",
        `%${search}%`
      );
    });
  }

  //count query
  const countQuery = base.clone().clearSelect().select("user.id as userId");
  const countResult = await db
    .count<{ count: string }>("userId")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // now select and query what we want for the data and apply pagination
  // User now has a single agent directly via user.agentId
  const dataQuery = base
    .clone()
    .select([
      db.raw(`(${sessionCountSubquery.toQuery()})::int as "sessionCount"`),
      db.raw(`(${messageCountSubquery.toQuery()})::int as "messageCount"`),
      db.raw(`(${lastMessageSubquery.toQuery()}) as "lastMessageAt"`),
      db.raw(`"agent"."id" as "agentId"`),
      db.raw(`"agent"."name" as "agentName"`),
      db.raw(`"agent"."niceName" as "agentNiceName"`),
      db.raw(
        `CAST(COALESCE((${costSubquery.toQuery()}), 0) AS FLOAT) as "totalCost"`
      ),
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
