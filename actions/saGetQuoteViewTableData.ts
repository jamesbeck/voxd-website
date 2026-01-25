"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

export interface QuoteViewFilters {
  quoteId?: string;
  excludePartnerViews?: boolean;
}

const saGetQuoteViewTableData = async ({
  search,
  page = 1,
  pageSize = 50,
  sortField = "datetime",
  sortDirection = "desc",
  quoteId,
  excludePartnerViews,
}: ServerActionReadParams<QuoteViewFilters>): Promise<ServerActionReadResponse> => {
  const token = await verifyAccessToken();

  if (!token) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const base = db("quoteView").leftJoin(
    "quote",
    "quoteView.quoteId",
    "quote.id"
  );

  // Filter by quoteId if provided
  if (quoteId) {
    base.where("quoteView.quoteId", quoteId);
  }

  // Exclude views from users who belong to the same partner
  if (excludePartnerViews && token.partnerId) {
    const partnerEmails = db("adminUser")
      .select("email")
      .where("partnerId", token.partnerId)
      .whereNotNull("email");
    base.where((qb) => {
      qb.whereNull("quoteView.loggedInEmail").orWhereNotIn(
        "quoteView.loggedInEmail",
        partnerEmails
      );
    });
  }

  // Always exclude localhost IPs in production
  if (process.env.NODE_ENV === "production") {
    base.whereNotIn("quoteView.ipAddress", ["::1", "127.0.0.1", "localhost"]);
  }

  // For non-super admins, restrict to their partner's quotes
  if (!token.superAdmin && token.partnerId) {
    base
      .leftJoin("organisation", "quote.organisationId", "organisation.id")
      .where("organisation.partnerId", token.partnerId);
  }

  if (search) {
    base.where((qb) => {
      qb.where("quoteView.ipAddress", "ilike", `%${search}%`)
        .orWhere("quoteView.browser", "ilike", `%${search}%`)
        .orWhere("quoteView.os", "ilike", `%${search}%`)
        .orWhere("quoteView.device", "ilike", `%${search}%`)
        .orWhere("quoteView.documentViewed", "ilike", `%${search}%`);
    });
  }

  // Count query
  const countResult = await base.clone().count("quoteView.id as count").first();
  const totalAvailable = countResult
    ? parseInt(countResult.count as string)
    : 0;

  // Data query
  const views = await base
    .clone()
    .select(
      "quoteView.id",
      "quoteView.quoteId",
      "quoteView.documentViewed",
      "quoteView.datetime",
      "quoteView.ipAddress",
      "quoteView.userAgent",
      "quoteView.browser",
      "quoteView.engine",
      "quoteView.os",
      "quoteView.device",
      "quoteView.cpu",
      "quoteView.locationData",
      "quoteView.loggedInEmail"
    )
    .orderBy(`quoteView.${sortField}`, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: views,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetQuoteViewTableData;
