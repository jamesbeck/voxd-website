"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetExampleTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams & {
  organisationId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  // Only partners and super admins can view examples
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "You do not have permission to view examples.",
    };
  }

  const base = db("example")
    .leftJoin("partner", "partner.id", "example.partnerId")
    .where((qb) => {
      if (search) {
        qb.where("example.title", "ilike", `%${search}%`);
      }
      // Partners can only see their own examples
      if (accessToken.partner && !accessToken.superAdmin) {
        qb.where("example.partnerId", accessToken.partnerId);
      }
    });

  //count query
  const countQuery = base.clone().select("example.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const examples = await base
    .clone()
    .select("example.*")
    .select("partner.name as partnerName")
    // .select(
    //   db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
    //   db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
    //   db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"')
    // )
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: examples,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetExampleTableData;
