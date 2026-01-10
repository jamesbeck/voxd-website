"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetQuoteTableData = async ({
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

  if (!accessToken.superAdmin && !accessToken.partner)
    return {
      success: false,
      error: "You do not have permission to view organisations.",
    };

  const base = db("quote")
    .leftJoin("organisation", "organisation.id", "quote.organisationId")
    .leftJoin("partner", "partner.id", "organisation.partnerId")
    .groupBy("quote.id", "organisation.id", "partner.id")
    .where((qb) => {
      if (search) {
        qb.where("organisation.name", "ilike", `%${search}%`);
        qb.orWhere("quote.title", "ilike", `%${search}%`);
      }
    });

  if (organisationId) base.where("quote.organisationId", organisationId);

  //if not super admin add where clause to only get the quote for relevant organisations
  if (accessToken?.partner && !accessToken?.superAdmin) {
    base.where("organisation.partnerId", accessToken.partnerId);
  }

  //count query
  const countQuery = base.clone().select("organisation.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const quotes = await base
    .clone()
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "partner.name as partnerName",
      "partner.id as partnerId"
    )

    // .select([db.raw('COUNT("agent"."id")::int as "agentCount"')])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: quotes,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetQuoteTableData;
