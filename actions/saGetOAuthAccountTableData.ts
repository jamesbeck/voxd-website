"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

interface OAuthAccountTableParams extends ServerActionReadParams {
  provider?: string;
  status?: string;
}

/**
 * Get OAuth accounts for the data table
 * Regular users see only their own accounts
 * Super admins can see all accounts
 */
const saGetOAuthAccountTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
  provider,
  status,
}: OAuthAccountTableParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.adminUserId) {
    return { success: false, error: "Unauthorized" };
  }

  const base = db("oauthAccount")
    .leftJoin("adminUser", "oauthAccount.adminUserId", "adminUser.id")
    .where((qb) => {
      if (search) {
        qb.where("oauthAccount.email", "ilike", `%${search}%`)
          .orWhere("oauthAccount.provider", "ilike", `%${search}%`)
          .orWhere("adminUser.name", "ilike", `%${search}%`);
      }
    });

  // Non-super admins can only see their own OAuth accounts
  if (!accessToken.superAdmin) {
    base.where("oauthAccount.adminUserId", accessToken.adminUserId);
  }

  // Additional filters
  if (provider) {
    base.where("oauthAccount.provider", provider);
  }

  if (status) {
    base.where("oauthAccount.status", status);
  }

  // Count query
  const countQuery = base.clone().select("oauthAccount.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // Get data
  const data = await base
    .clone()
    .select(
      "oauthAccount.id",
      "oauthAccount.provider",
      "oauthAccount.email",
      "oauthAccount.status",
      "oauthAccount.accessTokenExpiresAt",
      "oauthAccount.createdAt",
      "oauthAccount.updatedAt",
      "oauthAccount.revokedAt",
      "oauthAccount.scopes",
      "adminUser.name as adminUserName",
      "adminUser.email as adminUserEmail"
    )
    .orderByRaw(`"oauthAccount"."${sortField}" ${sortDirection} NULLS LAST`)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetOAuthAccountTableData;
