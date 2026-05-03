import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { applyAdminUserScope } from "@/lib/adminUserAccess";
import { AccessTokenPayload } from "@/types/tokenTypes";
import { Knex } from "knex";

export type AdminUserPermissionScopeMode = "global" | "agent" | string;

export type AdminUserPermissionAgentValue = {
  agentId: string;
  agentName: string;
  organisationId: string | null;
  organisationName: string | null;
  explicitValue: boolean | null;
  effectiveValue: boolean;
};

export type AdminUserPermissionItem = {
  permissionDefinitionId: string;
  key: string;
  name: string;
  description: string;
  scopeMode: AdminUserPermissionScopeMode;
  defaultValue: boolean;
  requiresSuperAdminToManage: boolean;
  globalExplicitValue: boolean | null;
  effectiveValue: boolean;
  agentValues: AdminUserPermissionAgentValue[];
};

export type AdminUserPermissionGroup = {
  id: string;
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  permissions: AdminUserPermissionItem[];
};

export type AdminUserPermissionsAccess = {
  targetUser: {
    id: string;
    name: string;
    organisationId: string | null;
    partnerId: string | null;
    superAdmin: boolean;
  };
  accessToken: AccessTokenPayload;
  canWritePermissions: boolean;
};

type PermissionGroupRow = {
  groupId: string;
  groupKey: string;
  groupName: string;
  groupDescription: string;
  groupSortOrder: number;
  permissionDefinitionId: string;
  permissionKey: string;
  permissionName: string;
  permissionDescription: string;
  permissionScopeMode: AdminUserPermissionScopeMode;
  permissionDefaultValue: boolean;
  permissionRequiresSuperAdminToManage: boolean;
  globalExplicitValue: boolean | null;
};

type ScopedAgentRow = {
  id: string;
  niceName: string;
  organisationId: string | null;
  organisationName: string | null;
};

type AgentPermissionRow = {
  permissionDefinitionId: string;
  agentId: string;
  explicitValue: boolean | null;
};

type PermissionValueRow = {
  defaultValue: boolean;
  scopeMode: AdminUserPermissionScopeMode;
  globalExplicitValue: boolean | null;
  agentExplicitValue?: boolean | null;
};

const getScopedAdminUserQuery = ({
  adminUserId,
  accessToken,
  trx = db,
}: {
  adminUserId: string;
  accessToken: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}) => {
  const query = trx("adminUser")
    .select(
      "adminUser.id",
      "adminUser.name",
      "adminUser.organisationId",
      "adminUser.partnerId",
      "adminUser.superAdmin",
    )
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .where("adminUser.id", adminUserId);

  applyAdminUserScope(query, accessToken);

  return query;
};

export const getScopedAdminUser = async ({
  adminUserId,
  accessToken,
  trx = db,
}: {
  adminUserId: string;
  accessToken: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}) => {
  return getScopedAdminUserQuery({ adminUserId, accessToken, trx }).first();
};

export const applyAgentScope = ({
  query,
  accessToken,
}: {
  query: Knex.QueryBuilder;
  accessToken: {
    superAdmin?: boolean | null;
    partnerId?: string | null;
    organisationId?: string | null;
  };
}) => {
  if (accessToken.superAdmin) {
    return query;
  }

  if (accessToken.partnerId) {
    query.where((qb) => {
      qb.where("organisation.partnerId", accessToken.partnerId);

      if (accessToken.organisationId) {
        qb.orWhere("agent.organisationId", accessToken.organisationId);
      }
    });

    return query;
  }

  return query.where("agent.organisationId", accessToken.organisationId);
};

export const getScopedAgentForAdminUser = async ({
  agentId,
  targetAdminUser,
  trx = db,
}: {
  agentId: string;
  targetAdminUser: {
    superAdmin?: boolean | null;
    partnerId?: string | null;
    organisationId?: string | null;
  };
  trx?: Knex | Knex.Transaction;
}) => {
  const query = trx("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .select("agent.id")
    .where("agent.id", agentId);

  applyAgentScope({
    query,
    accessToken: {
      superAdmin: targetAdminUser.superAdmin,
      partnerId: targetAdminUser.partnerId,
      organisationId: targetAdminUser.organisationId,
    },
  });

  return query.first();
};

export const getAccessibleAgentsForAdminUser = async ({
  targetAdminUser,
  trx = db,
}: {
  targetAdminUser: {
    superAdmin?: boolean | null;
    partnerId?: string | null;
    organisationId?: string | null;
  };
  trx?: Knex | Knex.Transaction;
}): Promise<ScopedAgentRow[]> => {
  const query = trx("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .select(
      "agent.id",
      "agent.niceName",
      "agent.organisationId",
      "organisation.name as organisationName",
    )
    .orderBy([
      { column: "organisation.name", order: "asc" },
      { column: "agent.niceName", order: "asc" },
    ]);

  applyAgentScope({
    query,
    accessToken: {
      superAdmin: targetAdminUser.superAdmin,
      partnerId: targetAdminUser.partnerId,
      organisationId: targetAdminUser.organisationId,
    },
  });

  return query as Promise<ScopedAgentRow[]>;
};

export const getAdminUserPermissionValue = async ({
  adminUserId,
  permissionKey,
  agentId,
  trx = db,
}: {
  adminUserId: string;
  permissionKey: string;
  agentId?: string;
  trx?: Knex | Knex.Transaction;
}) => {
  const query = trx("permissionDefinition")
    .select(
      "permissionDefinition.defaultValue",
      "permissionDefinition.scopeMode",
      "adminUserPermission.value as globalExplicitValue",
    )
    .leftJoin(
      "adminUserPermission",
      function joinAdminUserPermission() {
        this.on(
          "adminUserPermission.permissionDefinitionId",
          "=",
          "permissionDefinition.id",
        ).andOnVal("adminUserPermission.adminUserId", "=", adminUserId);
      },
    )
    .where("permissionDefinition.key", permissionKey);

  if (agentId) {
    query.leftJoin(
      "adminUserAgentPermission",
      function joinAdminUserAgentPermission() {
        this.on(
          "adminUserAgentPermission.permissionDefinitionId",
          "=",
          "permissionDefinition.id",
        )
          .andOnVal("adminUserAgentPermission.adminUserId", "=", adminUserId)
          .andOnVal("adminUserAgentPermission.agentId", "=", agentId);
      },
    );

    query.select("adminUserAgentPermission.value as agentExplicitValue");
  }

  const row = (await query.first()) as PermissionValueRow | undefined;

  if (!row) {
    return false;
  }

  if (row.scopeMode === "agent") {
    return row.globalExplicitValue ?? row.agentExplicitValue ?? row.defaultValue;
  }

  return row.globalExplicitValue ?? row.defaultValue;
};

export const hasAdminUserPermission = async ({
  adminUserId,
  permissionKey,
  agentId,
  trx = db,
}: {
  adminUserId: string;
  permissionKey: string;
  agentId?: string;
  trx?: Knex | Knex.Transaction;
}) => {
  return getAdminUserPermissionValue({
    adminUserId,
    permissionKey,
    agentId,
    trx,
  });
};

export const getAdminUserPermissionsAccess = async ({
  targetAdminUserId,
  accessToken,
  trx = db,
}: {
  targetAdminUserId: string;
  accessToken?: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}): Promise<AdminUserPermissionsAccess | null> => {
  const resolvedAccessToken = accessToken ?? (await verifyAccessToken());
  const targetUser = await getScopedAdminUser({
    adminUserId: targetAdminUserId,
    accessToken: resolvedAccessToken,
    trx,
  });

  if (!targetUser) {
    return null;
  }

  const canWritePermissions =
    resolvedAccessToken.superAdmin ||
    (await hasAdminUserPermission({
      adminUserId: resolvedAccessToken.adminUserId,
      permissionKey: "write_user_permissions",
      trx,
    }));

  return {
    targetUser: {
      id: targetUser.id,
      name: targetUser.name,
      organisationId: targetUser.organisationId ?? null,
      partnerId: targetUser.partnerId ?? null,
      superAdmin: Boolean(targetUser.superAdmin),
    },
    accessToken: resolvedAccessToken,
    canWritePermissions,
  };
};

export const getGroupedAdminUserPermissions = async ({
  adminUserId,
  trx = db,
}: {
  adminUserId: string;
  trx?: Knex | Knex.Transaction;
}): Promise<AdminUserPermissionGroup[]> => {
  const targetUser = await trx("adminUser")
    .select("id", "partnerId", "organisationId", "superAdmin")
    .where("id", adminUserId)
    .first();

  if (!targetUser) {
    return [];
  }

  const rows = (await trx("permissionGroup")
    .select(
      "permissionGroup.id as groupId",
      "permissionGroup.key as groupKey",
      "permissionGroup.name as groupName",
      "permissionGroup.description as groupDescription",
      "permissionGroup.sortOrder as groupSortOrder",
      "permissionDefinition.id as permissionDefinitionId",
      "permissionDefinition.key as permissionKey",
      "permissionDefinition.name as permissionName",
      "permissionDefinition.description as permissionDescription",
      "permissionDefinition.scopeMode as permissionScopeMode",
      "permissionDefinition.defaultValue as permissionDefaultValue",
      "permissionDefinition.requiresSuperAdminToManage as permissionRequiresSuperAdminToManage",
      "adminUserPermission.value as globalExplicitValue",
    )
    .join(
      "permissionDefinition",
      "permissionDefinition.permissionGroupId",
      "permissionGroup.id",
    )
    .leftJoin(
      "adminUserPermission",
      function joinAdminUserPermission() {
        this.on(
          "adminUserPermission.permissionDefinitionId",
          "=",
          "permissionDefinition.id",
        ).andOnVal("adminUserPermission.adminUserId", "=", adminUserId);
      },
    )
    .orderBy([
      { column: "permissionGroup.sortOrder", order: "asc" },
      { column: "permissionGroup.name", order: "asc" },
      { column: "permissionDefinition.name", order: "asc" },
    ])) as PermissionGroupRow[];

  const agentScopedPermissionDefinitionIds = rows
    .filter((row) => row.permissionScopeMode === "agent")
    .map((row) => row.permissionDefinitionId);

  const [accessibleAgents, agentPermissionRows] = await Promise.all([
    getAccessibleAgentsForAdminUser({
      targetAdminUser: targetUser,
      trx,
    }),
    agentScopedPermissionDefinitionIds.length > 0
      ? ((await trx("adminUserAgentPermission")
          .select(
            "permissionDefinitionId",
            "agentId",
            "value as explicitValue",
          )
          .where("adminUserId", adminUserId)
          .whereIn(
            "permissionDefinitionId",
            agentScopedPermissionDefinitionIds,
          )) as AgentPermissionRow[])
      : Promise.resolve([] as AgentPermissionRow[]),
  ]);

  const agentPermissionsByDefinition = new Map<
    string,
    Map<string, AgentPermissionRow>
  >();

  for (const row of agentPermissionRows) {
    const definitionMap =
      agentPermissionsByDefinition.get(row.permissionDefinitionId) ||
      new Map<string, AgentPermissionRow>();

    definitionMap.set(row.agentId, row);
    agentPermissionsByDefinition.set(row.permissionDefinitionId, definitionMap);
  }

  const groups = new Map<string, AdminUserPermissionGroup>();

  for (const row of rows) {
    const agentValues =
      row.permissionScopeMode === "agent"
        ? accessibleAgents.map((agent) => {
            const explicitAgentValue = agentPermissionsByDefinition
              .get(row.permissionDefinitionId)
              ?.get(agent.id)?.explicitValue;

            return {
              agentId: agent.id,
              agentName: agent.niceName,
              organisationId: agent.organisationId,
              organisationName: agent.organisationName,
              explicitValue: explicitAgentValue ?? null,
              effectiveValue:
                row.globalExplicitValue ??
                explicitAgentValue ??
                row.permissionDefaultValue,
            };
          })
        : [];

    const existingGroup = groups.get(row.groupId);

    if (existingGroup) {
      existingGroup.permissions.push({
        permissionDefinitionId: row.permissionDefinitionId,
        key: row.permissionKey,
        name: row.permissionName,
        description: row.permissionDescription,
        scopeMode: row.permissionScopeMode,
        defaultValue: row.permissionDefaultValue,
        requiresSuperAdminToManage:
          row.permissionRequiresSuperAdminToManage,
        globalExplicitValue: row.globalExplicitValue,
        effectiveValue: row.globalExplicitValue ?? row.permissionDefaultValue,
        agentValues,
      });

      continue;
    }

    groups.set(row.groupId, {
      id: row.groupId,
      key: row.groupKey,
      name: row.groupName,
      description: row.groupDescription,
      sortOrder: row.groupSortOrder,
      permissions: [
        {
          permissionDefinitionId: row.permissionDefinitionId,
          key: row.permissionKey,
          name: row.permissionName,
          description: row.permissionDescription,
          scopeMode: row.permissionScopeMode,
          defaultValue: row.permissionDefaultValue,
          requiresSuperAdminToManage:
            row.permissionRequiresSuperAdminToManage,
          globalExplicitValue: row.globalExplicitValue,
          effectiveValue: row.globalExplicitValue ?? row.permissionDefaultValue,
          agentValues,
        },
      ],
    });
  }

  return Array.from(groups.values());
};