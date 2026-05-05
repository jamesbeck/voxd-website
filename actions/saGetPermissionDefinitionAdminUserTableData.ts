"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  getPermissionDefinitionAdminUserSummaries,
  getPermissionDefinitionById,
} from "@/lib/adminPermissionCatalog";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

type SummaryRecord = Awaited<
  ReturnType<typeof getPermissionDefinitionAdminUserSummaries>
>[number];

const sortComparators: Record<
  string,
  (left: SummaryRecord, right: SummaryRecord) => number
> = {
  name: (left, right) => (left.name || "").localeCompare(right.name || ""),
  email: (left, right) => (left.email || "").localeCompare(right.email || ""),
  organisationName: (left, right) =>
    (left.organisationName || "").localeCompare(right.organisationName || ""),
  partnerName: (left, right) =>
    (left.partnerName || "").localeCompare(right.partnerName || ""),
  statusLabel: (left, right) =>
    left.statusLabel.localeCompare(right.statusLabel),
  lastLogin: (left, right) => {
    const leftTime = left.lastLogin ? new Date(left.lastLogin).getTime() : 0;
    const rightTime = right.lastLogin ? new Date(right.lastLogin).getTime() : 0;
    return leftTime - rightTime;
  },
};

const saGetPermissionDefinitionAdminUserTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "name",
  sortDirection = "asc",
  permissionDefinitionId,
}: ServerActionReadParams<{
  permissionDefinitionId?: string;
}>): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  if (!permissionDefinitionId) {
    return { success: false, error: "Permission definition is required" };
  }

  const permissionDefinition = await getPermissionDefinitionById({
    permissionDefinitionId,
  });

  if (!permissionDefinition) {
    return { success: false, error: "Permission definition not found" };
  }

  const rows = await getPermissionDefinitionAdminUserSummaries({
    permissionDefinitionId,
  });

  const normalizedSearch = search?.trim().toLowerCase();
  const filteredRows = normalizedSearch
    ? rows.filter((row) => {
        return [
          row.name,
          row.email,
          row.organisationName,
          row.partnerName,
          row.statusLabel,
          row.agentSummaryLabel,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch));
      })
    : rows;

  const comparator = sortComparators[sortField] || sortComparators.name;
  const sortedRows = [...filteredRows].sort((left, right) =>
    comparator(left, right),
  );

  if (sortDirection === "desc") {
    sortedRows.reverse();
  }

  const startIndex = (page - 1) * pageSize;
  const pagedRows = sortedRows.slice(startIndex, startIndex + pageSize);

  return {
    success: true,
    data: pagedRows.map((row) => ({
      ...row,
      scopeMode: permissionDefinition.scopeMode,
      defaultValue: permissionDefinition.defaultValue,
    })),
    totalAvailable: sortedRows.length,
    page,
    pageSize,
  };
};

export default saGetPermissionDefinitionAdminUserTableData;
