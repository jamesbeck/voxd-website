"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetPartnerTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to view partners.",
    };
  }

  //base query
  const base = db("partner")
    .groupBy("partner.id")
    .where((qb) => {
      if (search) {
        qb.where("partner.name", "ilike", `%${search}%`);
      }
    });

  //count query
  const countQuery = base.clone().select("partner.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // now select and query what we want for the data and apply pagination
  const dataQuery = base
    .clone()
    .select("partner.*")
    // .select([
    //   db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
    //   db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
    //   db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"'),
    // ])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const partners = await dataQuery;

  return {
    success: true,
    data: partners,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetPartnerTableData;
