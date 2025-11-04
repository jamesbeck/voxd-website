"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saGetUserTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  customerId,
  agentId,
}: ServerActionReadParams & {
  customerId?: string;
  agentId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  //you must be admin if not filtering by customerId or agentId
  if (!accessToken?.admin && !customerId && !agentId) {
    return {
      success: false,
      error: "You do not have permission to view users.",
    };
  }

  if (!(await userCanViewAgent({ agentId: agentId! }))) {
    return {
      success: false,
      error: "You do not have permission to view this agent.",
    };
  }

  //base query
  const base = db("user")
    .leftJoin("session", "user.id", "session.userId")
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
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

  if (customerId) {
    base.leftJoin("customerUser", "user.id", "customerUser.userId");
    base.where("customerUser.customerId", customerId);
  }

  if (agentId) {
    base.leftJoin("agent", "agent.id", "session.agentId");
    base.where("agent.id", agentId);
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

export default saGetUserTableData;
