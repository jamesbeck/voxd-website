"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetAgentTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  organisationId,
}: ServerActionReadParams & {
  organisationId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("agent")
    .leftJoin("session", "agent.id", "session.agentId")
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .leftJoin("phoneNumber", "agent.phoneNumberId", "phoneNumber.id")
    .groupBy("agent.id", "phoneNumber.id")
    .where((qb) => {
      if (search) {
        qb.where("agent.name", "ilike", `%${search}%`);
        qb.orWhere("agent.niceName", "ilike", `%${search}%`);
      }
    });

  if (organisationId) {
    base.where("agent.organisationId", organisationId);
  }

  //if organisation is logging in, restrict to their agents
  if (!accessToken.partner && !accessToken.admin) {
    base
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .leftJoin(
        "organisationUser",
        "organisation.id",
        "organisationUser.organisationId"
      )
      .where("organisationUser.adminUserId", accessToken!.adminUserId);
  }

  //if partner is logging in, restrict to their agents
  if (accessToken?.partner && !accessToken.admin) {
    base
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .where("organisation.partnerId", accessToken!.partnerId);
  }

  //count query
  const countQuery = base.clone().select("agent.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const agents = await base
    .clone()
    .select("agent.*")
    .select("phoneNumber.displayPhoneNumber as phoneNumber")
    .select(
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"')
    )
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: agents,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetAgentTableData;
