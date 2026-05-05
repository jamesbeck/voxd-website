import db from "@/database/db";

export type PermissionScopeMode = "global" | "agent" | string;

export type PermissionGroupRecord = {
  id: string;
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  definitionCount?: number;
};

export type PermissionDefinitionRecord = {
  id: string;
  permissionGroupId: string;
  permissionGroupKey: string;
  permissionGroupName: string;
  key: string;
  name: string;
  description: string;
  scopeMode: PermissionScopeMode;
  defaultValue: boolean;
  requiresSuperAdminToManage: boolean;
  createdAt: Date;
  updatedAt: Date;
  explicitGlobalAssignmentCount?: number;
  explicitAgentAssignmentCount?: number;
};

type PermissionDefinitionAdminUserSummaryRow = {
  id: string;
  name: string | null;
  email: string | null;
  organisationId: string | null;
  organisationName: string | null;
  partnerId: string | null;
  partnerName: string | null;
  superAdmin: boolean | null;
  lastLogin: Date | null;
  globalExplicitValue: boolean | null;
  agentExplicitTrueCount: string | number;
  agentExplicitFalseCount: string | number;
  accessibleAgentCount: string | number;
};

export type PermissionDefinitionAdminUserSummary = {
  id: string;
  name: string | null;
  email: string | null;
  organisationId: string | null;
  organisationName: string | null;
  partnerId: string | null;
  partnerName: string | null;
  superAdmin: boolean;
  lastLogin: Date | null;
  globalExplicitValue: boolean | null;
  statusLabel: string;
  statusGranted: boolean;
  agentSummaryLabel: string | null;
  accessibleAgentCount: number;
  agentExplicitTrueCount: number;
  agentExplicitFalseCount: number;
};

export const getPermissionGroupOptions = async (): Promise<
  { id: string; name: string }[]
> => {
  return db("permissionGroup")
    .select("id", "name")
    .orderBy([
      { column: "sortOrder", order: "asc" },
      { column: "name", order: "asc" },
    ]);
};

export const getPermissionGroupById = async ({
  permissionGroupId,
}: {
  permissionGroupId: string;
}): Promise<PermissionGroupRecord | null> => {
  const row = await db("permissionGroup")
    .leftJoin(
      db("permissionDefinition")
        .select("permissionGroupId")
        .count<{ definitionCount: string }>("id as definitionCount")
        .groupBy("permissionGroupId")
        .as("definitionCounts"),
      "definitionCounts.permissionGroupId",
      "permissionGroup.id",
    )
    .where("permissionGroup.id", permissionGroupId)
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
    .first();

  if (!row) {
    return null;
  }

  return {
    ...row,
    definitionCount: Number(row.definitionCount ?? 0),
  } as PermissionGroupRecord;
};

export const getPermissionDefinitionById = async ({
  permissionDefinitionId,
}: {
  permissionDefinitionId: string;
}): Promise<PermissionDefinitionRecord | null> => {
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

  const row = await db("permissionDefinition")
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
    .where("permissionDefinition.id", permissionDefinitionId)
    .select(
      "permissionDefinition.id",
      "permissionDefinition.permissionGroupId",
      "permissionGroup.key as permissionGroupKey",
      "permissionGroup.name as permissionGroupName",
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
    .first();

  if (!row) {
    return null;
  }

  return {
    ...row,
    explicitGlobalAssignmentCount: Number(
      row.explicitGlobalAssignmentCount ?? 0,
    ),
    explicitAgentAssignmentCount: Number(row.explicitAgentAssignmentCount ?? 0),
  } as PermissionDefinitionRecord;
};

export const getPermissionDefinitionAdminUserSummaries = async ({
  permissionDefinitionId,
}: {
  permissionDefinitionId: string;
}): Promise<PermissionDefinitionAdminUserSummary[]> => {
  const definition = await db("permissionDefinition")
    .select("id", "defaultValue", "scopeMode")
    .where("id", permissionDefinitionId)
    .first();

  if (!definition) {
    return [];
  }

  const lastLoginSubquery = db("log")
    .select("adminUserId")
    .max("createdAt as lastLogin")
    .where("event", "User Login")
    .groupBy("adminUserId")
    .as("lastLoginQuery");

  const rows = (await db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .leftJoin(
      "organisation as partnerOrganisation",
      "organisation.partnerId",
      "partnerOrganisation.id",
    )
    .leftJoin(lastLoginSubquery, "adminUser.id", "lastLoginQuery.adminUserId")
    .leftJoin("adminUserPermission", function joinAdminUserPermission() {
      this.on("adminUserPermission.adminUserId", "=", "adminUser.id").andOnVal(
        "adminUserPermission.permissionDefinitionId",
        "=",
        permissionDefinitionId,
      );
    })
    .leftJoin(
      db("agent")
        .leftJoin(
          "organisation as scopedAgentOrganisation",
          "agent.organisationId",
          "scopedAgentOrganisation.id",
        )
        .select(
          "agent.id",
          "agent.organisationId",
          "scopedAgentOrganisation.partnerId as scopedAgentPartnerId",
        )
        .as("scopedAgents"),
      function joinScopedAgents() {
        this.on(function matchAccessibleAgents() {
          this.onVal("adminUser.superAdmin", "=", true)
            .orOn(
              "scopedAgents.organisationId",
              "=",
              "adminUser.organisationId",
            )
            .orOn(function matchPartnerScopedAgents() {
              this.onVal("organisation.partner", "=", true).andOn(
                "scopedAgents.scopedAgentPartnerId",
                "=",
                "organisation.id",
              );
            });
        });
      },
    )
    .leftJoin(
      "adminUserAgentPermission",
      function joinAdminUserAgentPermission() {
        this.on("adminUserAgentPermission.adminUserId", "=", "adminUser.id")
          .andOn("adminUserAgentPermission.agentId", "=", "scopedAgents.id")
          .andOnVal(
            "adminUserAgentPermission.permissionDefinitionId",
            "=",
            permissionDefinitionId,
          );
      },
    )
    .groupBy(
      "adminUser.id",
      "organisation.id",
      "partnerOrganisation.id",
      "lastLoginQuery.lastLogin",
      "adminUserPermission.value",
    )
    .select(
      "adminUser.id",
      "adminUser.name",
      "adminUser.email",
      "adminUser.superAdmin",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      db.raw(
        'CASE WHEN organisation.partner THEN organisation.id ELSE "partnerOrganisation".id END as "partnerId"',
      ),
      db.raw(
        'CASE WHEN organisation.partner THEN organisation.name ELSE "partnerOrganisation".name END as "partnerName"',
      ),
      "lastLoginQuery.lastLogin",
      "adminUserPermission.value as globalExplicitValue",
      db.raw(
        'COUNT(DISTINCT "scopedAgents"."id")::int as "accessibleAgentCount"',
      ),
      db.raw(
        'COUNT(DISTINCT CASE WHEN "adminUserAgentPermission"."value" = true THEN "adminUserAgentPermission"."agentId" END)::int as "agentExplicitTrueCount"',
      ),
      db.raw(
        'COUNT(DISTINCT CASE WHEN "adminUserAgentPermission"."value" = false THEN "adminUserAgentPermission"."agentId" END)::int as "agentExplicitFalseCount"',
      ),
    )
    .orderBy([
      { column: "adminUser.name", order: "asc" },
      { column: "adminUser.email", order: "asc" },
    ])) as PermissionDefinitionAdminUserSummaryRow[];

  return rows.map((row) => {
    const accessibleAgentCount = Number(row.accessibleAgentCount ?? 0);
    const agentExplicitTrueCount = Number(row.agentExplicitTrueCount ?? 0);
    const agentExplicitFalseCount = Number(row.agentExplicitFalseCount ?? 0);

    if (definition.scopeMode === "agent") {
      if (row.globalExplicitValue !== null) {
        const granted = Boolean(row.globalExplicitValue);
        return {
          ...row,
          superAdmin: Boolean(row.superAdmin),
          accessibleAgentCount,
          agentExplicitTrueCount,
          agentExplicitFalseCount,
          statusGranted: granted,
          statusLabel: `Global override: ${granted ? "Granted" : "Not granted"}`,
          agentSummaryLabel:
            accessibleAgentCount > 0
              ? `${agentExplicitTrueCount + agentExplicitFalseCount}/${accessibleAgentCount} agent overrides set`
              : "No accessible agents",
        };
      }

      const grantedCount = definition.defaultValue
        ? Math.max(accessibleAgentCount - agentExplicitFalseCount, 0)
        : agentExplicitTrueCount;
      const statusGranted = grantedCount > 0;

      return {
        ...row,
        superAdmin: Boolean(row.superAdmin),
        accessibleAgentCount,
        agentExplicitTrueCount,
        agentExplicitFalseCount,
        statusGranted,
        statusLabel:
          accessibleAgentCount > 0
            ? `Granted for ${grantedCount}/${accessibleAgentCount} agents`
            : definition.defaultValue
              ? "Granted by default"
              : "Not granted",
        agentSummaryLabel:
          accessibleAgentCount > 0
            ? `${agentExplicitTrueCount} explicit grants, ${agentExplicitFalseCount} explicit denials`
            : "No accessible agents",
      };
    }

    const statusGranted =
      row.globalExplicitValue === null
        ? Boolean(definition.defaultValue)
        : Boolean(row.globalExplicitValue);

    return {
      ...row,
      superAdmin: Boolean(row.superAdmin),
      accessibleAgentCount,
      agentExplicitTrueCount,
      agentExplicitFalseCount,
      statusGranted,
      statusLabel: statusGranted ? "Granted" : "Not granted",
      agentSummaryLabel: null,
    };
  });
};
