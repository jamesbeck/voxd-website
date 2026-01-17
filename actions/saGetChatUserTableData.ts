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

  // Helper to build access-restricted chatUser query
  // ChatUsers are now scoped to agents directly (chatUser.agentId)
  const buildAccessRestrictedUserQuery = () => {
    const subquery = db("chatUser")
      .leftJoin("agent", "chatUser.agentId", "agent.id")
      .leftJoin("organisation", "agent.organisationId", "organisation.id");

    if (organisationId) {
      subquery.where("organisation.id", organisationId);
    }
    if (agentId) {
      subquery.where("agent.id", agentId);
    }
    if (!accessToken.partner && !accessToken.superAdmin) {
      subquery.where("organisation.id", accessToken.organisationId);
    }
    if (accessToken?.partner && !accessToken.superAdmin) {
      subquery.where("organisation.partnerId", accessToken!.partnerId);
    }

    return subquery;
  };

  // Helper to build session query for a chatUser (sessions no longer have agentId)
  const buildSessionQueryForUser = () => {
    const subquery = db("session")
      .leftJoin("chatUser as sessionUser", "session.userId", "sessionUser.id")
      .leftJoin("agent", "sessionUser.agentId", "agent.id")
      .leftJoin("organisation", "agent.organisationId", "organisation.id");

    // Only super admin can see development sessions
    if (!accessToken.superAdmin) {
      subquery.where("session.sessionType", "!=", "development");
    }

    return subquery;
  };

  // Session count subquery
  const sessionCountSubquery = buildSessionQueryForUser()
    .clone()
    .select(db.raw('COUNT(DISTINCT "session"."id")'))
    .whereRaw('"session"."userId" = "chatUser"."id"');

  // Message count subquery
  const messageCountSubquery = buildSessionQueryForUser()
    .clone()
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select(db.raw('COUNT("userMessage"."id")'))
    .whereRaw('"session"."userId" = "chatUser"."id"');

  // Last message subquery
  const lastMessageSubquery = buildSessionQueryForUser()
    .clone()
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select(db.raw('MAX("userMessage"."createdAt")'))
    .whereRaw('"session"."userId" = "chatUser"."id"');

  // Cost subquery - now uses chatUser.agentId instead of session.agentId
  const costSubquery = db("assistantMessage")
    .select(
      db.raw(
        'SUM("assistantMessage"."inputCost" + "assistantMessage"."outputCost")'
      )
    )
    .leftJoin("session", "assistantMessage.sessionId", "session.id")
    .leftJoin("chatUser as costUser", "session.userId", "costUser.id")
    .leftJoin("agent as costAgent", "costUser.agentId", "costAgent.id")
    .leftJoin(
      "organisation as costOrg",
      "costAgent.organisationId",
      "costOrg.id"
    )
    .whereRaw('"session"."userId" = "chatUser"."id"')
    .modify((qb: any) => {
      if (organisationId) {
        qb.where("costOrg.id", organisationId);
      }
      if (agentId) {
        qb.where("costAgent.id", agentId);
      }
      if (!accessToken.partner && !accessToken.superAdmin) {
        qb.where("costOrg.id", accessToken.organisationId);
      }
      if (accessToken?.partner && !accessToken.superAdmin) {
        qb.where("costOrg.partnerId", accessToken!.partnerId);
      }
      // Only super admin can see development sessions
      if (!accessToken.superAdmin) {
        qb.where("session.sessionType", "!=", "development");
      }
    });

  // Base query - filter chatUsers by access
  const base = buildAccessRestrictedUserQuery().clone().select("chatUser.*");

  if (search) {
    base.where((qb) => {
      qb.where("chatUser.name", "ilike", `%${search}%`).orWhere(
        "chatUser.number",
        "ilike",
        `%${search}%`
      );
    });
  }

  //count query
  const countQuery = base
    .clone()
    .clearSelect()
    .select("chatUser.id as chatUserId");
  const countResult = await db
    .count<{ count: string }>("chatUserId")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // now select and query what we want for the data and apply pagination
  // ChatUser now has a single agent directly via chatUser.agentId
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
