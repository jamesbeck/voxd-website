"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetProviderApiKeyTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
  organisationId,
}: ServerActionReadParams & {
  organisationId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin && !accessToken.partner) {
    return { success: false, error: "Unauthorized" };
  }

  const base = db("providerApiKey")
    .leftJoin("provider", "providerApiKey.providerId", "provider.id")
    .leftJoin(
      "organisation",
      "providerApiKey.organisationId",
      "organisation.id",
    )
    .where((qb) => {
      if (search) {
        qb.where("providerApiKey.key", "ilike", `%${search}%`)
          .orWhere("provider.name", "ilike", `%${search}%`)
          .orWhere("organisation.name", "ilike", `%${search}%`);
      }
    });

  if (organisationId) {
    base.where("providerApiKey.organisationId", organisationId);
  }

  // Partner-level users can only see keys in their organisations
  if (accessToken.partner && !accessToken.superAdmin) {
    base.whereIn("providerApiKey.organisationId", function () {
      this.select("id")
        .from("organisation")
        .where("partnerId", accessToken.partnerId);
    });
  }

  const countQuery = base.clone().select("providerApiKey.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();
  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const dataQuery = base
    .clone()
    .select(
      "providerApiKey.id",
      "providerApiKey.key",
      "providerApiKey.createdAt",
      "providerApiKey.providerId",
      "providerApiKey.organisationId",
      "provider.name as providerName",
      "organisation.name as organisationName",
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const data = await dataQuery;

  return {
    success: true,
    data,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetProviderApiKeyTableData;
