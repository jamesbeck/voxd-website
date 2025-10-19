"use server";

import db from "../database/db";
// import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetWabaTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  // const accessToken = await verifyAccessToken();

  const base = db("waba")
    .leftJoin("phoneNumber", "waba.id", "phoneNumber.wabaId")
    .leftJoin("metaBusiness", "waba.metaBusinessId", "metaBusiness.id")
    .groupBy("waba.id", "metaBusiness.id")
    .where((qb) => {
      if (search) {
        qb.where("waba.name", "ilike", `%${search}%`);
      }
    });

  //if not admin add where clause to only get the agent with the email from the access token
  // if (!accessToken?.admin) {
  //   base.whereIn("agent.customerId", accessToken?.customerIds || []);
  // }

  //count query
  const countQuery = base.clone().select("waba.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const wabas = await base
    .clone()
    .select("waba.*")
    .select("metaBusiness.name as businessName")
    // .select(
    //   db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
    //   db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
    //   db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"')
    // )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: wabas,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetWabaTableData;
