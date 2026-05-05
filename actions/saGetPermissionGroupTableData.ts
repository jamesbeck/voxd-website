"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const sortFieldMap: Record<string, string> = {
  key: "permissionGroup.key",
  name: "permissionGroup.name",
  sortOrder: "permissionGroup.sortOrder",
  createdAt: "permissionGroup.createdAt",
  updatedAt: "permissionGroup.updatedAt",
};

const saGetPermissionGroupTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "sortOrder",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const definitionCounts = db("permissionDefinition")
    .select("permissionGroupId")
    .count<{ definitionCount: string }>("id as definitionCount")
    .groupBy("permissionGroupId")
    .as("definitionCounts");

  const baseQuery = db("permissionGroup")
    .leftJoin(
      definitionCounts,
      "definitionCounts.permissionGroupId",
      "permissionGroup.id",
    )
    .where((query) => {
      if (!search) {
        return;
      }

      query
        .where("permissionGroup.name", "ilike", `%${search}%`)
        .orWhere("permissionGroup.key", "ilike", `%${search}%`)
        .orWhere("permissionGroup.description", "ilike", `%${search}%`);
    });

  const countQuery = baseQuery.clone().select("permissionGroup.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery.as("permissionGroups"))
    .first();

  const totalAvailable = Number(countResult?.count ?? 0);
  const orderColumn = sortFieldMap[sortField] || sortFieldMap.sortOrder;
  const orderDirection = sortDirection === "desc" ? "desc" : "asc";

  const rows = await baseQuery
    .clone()
    .select(
      "permissionGroup.id",
      "permissionGroup.key",
      "permissionGroup.name",
      "permissionGroup.description",
      "permissionGroup.sortOrder",
      "permissionGroup.createdAt",
      "permissionGroup.updatedAt",
      db.raw(
        'COALESCE("definitionCounts"."definitionCount", 0) as "definitionCount"',
      ),
    )
    .orderBy(orderColumn, orderDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: rows.map((row) => ({
      ...row,
      definitionCount: Number(row.definitionCount ?? 0),
    })),
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetPermissionGroupTableData;
