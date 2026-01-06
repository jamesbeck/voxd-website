"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetWabaTemplatesTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "name",
  sortDirection = "asc",
  wabaId,
}: ServerActionReadParams & {
  wabaId: string;
}): Promise<ServerActionReadResponse> => {
  // Verify admin access
  const accessToken = await verifyAccessToken();
  if (!accessToken?.admin) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  // wabaId from URL could be either the database UUID or Meta ID
  // Try to find by database id first, then by metaId
  let waba = await db("waba").where({ id: wabaId }).first();
  if (!waba) {
    waba = await db("waba").where({ metaId: wabaId }).first();
  }
  const dbWabaId = waba?.id;

  if (!dbWabaId) {
    return {
      success: true,
      data: [],
      totalAvailable: 0,
      page,
      pageSize,
    };
  }

  const base = db("waTemplate").where((qb) => {
    if (search) {
      qb.where("waTemplate.name", "ilike", `%${search}%`)
        .orWhere("waTemplate.category", "ilike", `%${search}%`)
        .orWhere("waTemplate.status", "ilike", `%${search}%`);
    }
  });

  base.where("waTemplate.wabaId", dbWabaId);

  // Count query
  const countQuery = base.clone().select("waTemplate.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const templates = await base
    .clone()
    .select(
      "waTemplate.id",
      "waTemplate.metaId",
      "waTemplate.name",
      "waTemplate.status",
      "waTemplate.category",
      "waTemplate.data",
      "waTemplate.createdAt",
      "waTemplate.updatedAt"
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const data = templates.map((t) => ({
    id: t.id,
    metaId: t.metaId,
    name: t.name,
    status: t.status,
    category: t.category,
    language: t.data?.language,
    qualityScore: t.data?.quality_score?.score,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return {
    success: true,
    data,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetWabaTemplatesTableData;
