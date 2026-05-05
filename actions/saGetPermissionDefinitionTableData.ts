"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const sortFieldMap: Record<string, string> = {
  name: "permissionDefinition.name",
  key: "permissionDefinition.key",
  permissionGroupName: "permissionGroup.name",
  scopeMode: "permissionDefinition.scopeMode",
  defaultValue: "permissionDefinition.defaultValue",
  requiresSuperAdminToManage: "permissionDefinition.requiresSuperAdminToManage",
  createdAt: "permissionDefinition.createdAt",
  updatedAt: "permissionDefinition.updatedAt",
};

const saGetPermissionDefinitionTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "name",
  sortDirection = "asc",
  permissionGroupId,
}: ServerActionReadParams<{
  permissionGroupId?: string;
}>): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const globalAssignmentCounts = db("adminUserPermission")
    .select("permissionDefinitionId")
    .count<{
      explicitGlobalAssignmentCount: string;
    }>("id as explicitGlobalAssignmentCount")
    .groupBy("permissionDefinitionId")
    .as("globalAssignmentCounts");

  const agentAssignmentCounts = db("adminUserAgentPermission")
    .select("permissionDefinitionId")
    .count<{
      explicitAgentAssignmentCount: string;
    }>("id as explicitAgentAssignmentCount")
    .groupBy("permissionDefinitionId")
    .as("agentAssignmentCounts");

  const baseQuery = db("permissionDefinition")
    .join(
      "permissionGroup",
      "permissionDefinition.permissionGroupId",
      "permissionGroup.id",
    )
    .leftJoin(
      globalAssignmentCounts,
      "globalAssignmentCounts.permissionDefinitionId",
      "permissionDefinition.id",
    )
    .leftJoin(
      agentAssignmentCounts,
      "agentAssignmentCounts.permissionDefinitionId",
      "permissionDefinition.id",
    )
    .where((query) => {
      if (permissionGroupId) {
        query.where(
          "permissionDefinition.permissionGroupId",
          permissionGroupId,
        );
      }

      if (!search) {
        return;
      }

      query.andWhere((searchQuery) => {
        searchQuery
          .where("permissionDefinition.name", "ilike", `%${search}%`)
          .orWhere("permissionDefinition.key", "ilike", `%${search}%`)
          .orWhere("permissionDefinition.description", "ilike", `%${search}%`)
          .orWhere("permissionGroup.name", "ilike", `%${search}%`)
          .orWhere("permissionGroup.key", "ilike", `%${search}%`);
      });
    });

  const countQuery = baseQuery.clone().select("permissionDefinition.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery.as("permissionDefinitions"))
    .first();

  const totalAvailable = Number(countResult?.count ?? 0);
  const orderColumn = sortFieldMap[sortField] || sortFieldMap.name;
  const orderDirection = sortDirection === "desc" ? "desc" : "asc";

  const rows = await baseQuery
    .clone()
    .select(
      "permissionDefinition.id",
      "permissionDefinition.permissionGroupId",
      "permissionGroup.name as permissionGroupName",
      "permissionGroup.key as permissionGroupKey",
      "permissionDefinition.key",
      "permissionDefinition.name",
      "permissionDefinition.description",
      "permissionDefinition.scopeMode",
      "permissionDefinition.defaultValue",
      "permissionDefinition.requiresSuperAdminToManage",
      "permissionDefinition.createdAt",
      "permissionDefinition.updatedAt",
      db.raw(
        'COALESCE("globalAssignmentCounts"."explicitGlobalAssignmentCount", 0) as "explicitGlobalAssignmentCount"',
      ),
      db.raw(
        'COALESCE("agentAssignmentCounts"."explicitAgentAssignmentCount", 0) as "explicitAgentAssignmentCount"',
      ),
    )
    .orderBy(orderColumn, orderDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: rows.map((row) => ({
      ...row,
      explicitGlobalAssignmentCount: Number(
        row.explicitGlobalAssignmentCount ?? 0,
      ),
      explicitAgentAssignmentCount: Number(
        row.explicitAgentAssignmentCount ?? 0,
      ),
    })),
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetPermissionDefinitionTableData;
