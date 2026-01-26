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
  partnerId,
}: ServerActionReadParams & {
  organisationId?: string;
  partnerId?: string;
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

  // Allow superAdmins to filter by a specific partnerId
  if (accessToken?.superAdmin && partnerId) {
    base.where("organisation.partnerId", partnerId);
  }

  //count query
  const countQuery = base.clone().select("organisation.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // Subquery to get the latest view datetime for each quote
  // Excludes views from users belonging to the same partner
  const partnerEmails = accessToken.partnerId
    ? db("adminUser")
        .select("email")
        .where("partnerId", accessToken.partnerId)
        .whereNotNull("email")
    : null;

  const lastViewedSubquery = db("quoteView")
    .select("quoteId")
    .max("datetime as lastViewedAt")
    .where((qb) => {
      if (partnerEmails) {
        qb.whereNull("loggedInEmail").orWhereNotIn(
          "loggedInEmail",
          partnerEmails,
        );
      }
    })
    .groupBy("quoteId")
    .as("lastViewed");

  const quotes = await base
    .clone()
    .leftJoin(lastViewedSubquery, "lastViewed.quoteId", "quote.id")
    .groupBy("lastViewed.lastViewedAt")
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "partner.name as partnerName",
      "partner.id as partnerId",
      "lastViewed.lastViewedAt",
    )

    // .select([db.raw('COUNT("agent"."id")::int as "agentCount"')])
    .orderByRaw(
      sortField === "lastViewedAt"
        ? `"lastViewed"."lastViewedAt" ${sortDirection} NULLS LAST`
        : `"${sortField}" ${sortDirection}`,
    )
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
