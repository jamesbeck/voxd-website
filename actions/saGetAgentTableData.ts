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
  customerId,
}: ServerActionReadParams & {
  customerId?: string;
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

  if (customerId) {
    base.where("agent.customerId", customerId);
  }

  //if not admin add where clause to only get the agent with the email from the access token
  if (!accessToken?.admin) {
    base.whereIn("agent.customerId", accessToken?.customerIds || []);
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
