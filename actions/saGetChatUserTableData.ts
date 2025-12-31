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

  // Helper to build access-restricted session subquery
  const buildAccessRestrictedSessionQuery = () => {
    const subquery = db("session")
      .leftJoin("agent", "session.agentId", "agent.id")
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
    // Only admin can see development sessions
    if (!accessToken.admin) {
      subquery.where("session.sessionType", "!=", "development");
    }

    return subquery;
  };

  // Session count subquery
  const sessionCountSubquery = buildAccessRestrictedSessionQuery()
    .clone()
    .select(db.raw('COUNT(DISTINCT "session"."id")'))
    .whereRaw('"session"."userId" = "user"."id"');

  // Message count subquery
  const messageCountSubquery = buildAccessRestrictedSessionQuery()
    .clone()
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select(db.raw('COUNT("userMessage"."id")'))
    .whereRaw('"session"."userId" = "user"."id"');

  // Last message subquery
  const lastMessageSubquery = buildAccessRestrictedSessionQuery()
    .clone()
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select(db.raw('MAX("userMessage"."createdAt")'))
    .whereRaw('"session"."userId" = "user"."id"');

  // Agents subquery
  const agentsSubquery = buildAccessRestrictedSessionQuery()
    .clone()
    .select(
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
        )
      `)
    )
    .whereRaw('"session"."userId" = "user"."id"');

  // Cost subquery
  const costSubquery = db("assistantMessage")
    .select(
      db.raw(
        'SUM("assistantMessage"."promptTokens" * "model"."inputTokenCost" + "assistantMessage"."completionTokens" * "model"."outputTokenCost") / 1000000.0'
      )
    )
    .leftJoin("model", "assistantMessage.modelId", "model.id")
    .leftJoin("session", "assistantMessage.sessionId", "session.id")
    .leftJoin("agent", "session.agentId", "agent.id")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .whereRaw('"session"."userId" = "user"."id"')
    .modify((qb: any) => {
      if (organisationId) {
        qb.where("organisation.id", organisationId);
      }
      if (agentId) {
        qb.where("agent.id", agentId);
      }
      if (!accessToken.partner && !accessToken.admin) {
        qb.whereExists(function (this: any) {
          this.select(db.raw(1))
            .from("organisationUser")
            .whereRaw(
              '"organisationUser"."organisationId" = "organisation"."id"'
            )
            .where("organisationUser.adminUserId", accessToken!.adminUserId);
        });
      }
      if (accessToken?.partner && !accessToken.admin) {
        qb.where("organisation.partnerId", accessToken!.partnerId);
      }
      // Only admin can see development sessions
      if (!accessToken.admin) {
        qb.where("session.sessionType", "!=", "development");
      }
    });

  // Base query just for users who have sessions matching access criteria
  const base = db("user").whereExists(
    buildAccessRestrictedSessionQuery()
      .clone()
      .select(db.raw(1))
      .whereRaw('"session"."userId" = "user"."id"')
  );

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
      db.raw(`(${sessionCountSubquery.toQuery()})::int as "sessionCount"`),
      db.raw(`(${messageCountSubquery.toQuery()})::int as "messageCount"`),
      db.raw(`(${lastMessageSubquery.toQuery()}) as "lastMessageAt"`),
      db.raw(`(${agentsSubquery.toQuery()}) as "agents"`),
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
