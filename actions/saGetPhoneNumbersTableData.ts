"use server";

import db from "../database/db";
// import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetPhoneNumbersTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  wabaId,
}: ServerActionReadParams & {
  wabaId?: string;
}): Promise<ServerActionReadResponse> => {
  // const accessToken = await verifyAccessToken();

  const base = db("phoneNumber")
    // .leftJoin("phoneNumber", "waba.id", "phoneNumber.wabaId")
    // .leftJoin("metaBusiness", "waba.metaBusinessId", "metaBusiness.id")
    // .groupBy("waba.id", "metaBusiness.id")
    .where((qb) => {
      if (search) {
        qb.where("phoneNumber.displayPhoneNumber", "ilike", `%${search}%`);
      }
    });

  if (wabaId) {
    base.where("phoneNumber.wabaId", wabaId);
  }

  //if not admin add where clause to only get the agent with the email from the access token
  // if (!accessToken?.admin) {
  //   base.whereIn("agent.organisationId", accessToken?.organisationIds || []);
  // }

  //count query
  const countQuery = base.clone().select("phoneNumber.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const phoneNumbers = await base
    .clone()
    .select("phoneNumber.*")
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
    data: phoneNumbers,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetPhoneNumbersTableData;
