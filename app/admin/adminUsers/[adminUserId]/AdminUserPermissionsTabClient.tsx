"use client";

import saSetAdminUserPermission from "@/actions/saSetAdminUserPermission";
import type {
  AdminUserPermissionAgentValue,
  AdminUserPermissionGroup,
  AdminUserPermissionItem,
} from "@/lib/adminUserPermissions";
import H2 from "@/components/adminui/H2";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const getInitialPermissionValues = (
  permissionGroups: AdminUserPermissionGroup[],
) => {
  return Object.fromEntries(
    permissionGroups.flatMap((group) =>
      group.permissions.flatMap((permission) => {
        if (permission.scopeMode === "agent") {
          return permission.agentValues.map((agentValue) => [
            getPermissionValueKey(permission.permissionDefinitionId, agentValue.agentId),
            agentValue.effectiveValue,
          ]);
        }

        return [
          [
            getPermissionValueKey(permission.permissionDefinitionId),
            permission.effectiveValue,
          ],
        ];
      }),
    ),
  ) as Record<string, boolean>;
};

const getPermissionValueKey = (
  permissionDefinitionId: string,
  agentId?: string,
) => `${permissionDefinitionId}:${agentId || "global"}`;

const superAdminTooltipMessage =
  "Please raise a support ticket if you need to change this permission.";

export default function AdminUserPermissionsTabClient({
  adminUserId,
  canWritePermissions,
  isSuperAdmin,
  permissionGroups,
}: {
  adminUserId: string;
  canWritePermissions: boolean;
  isSuperAdmin: boolean;
  permissionGroups: AdminUserPermissionGroup[];
}) {
  const writeUserPermissionsName =
    permissionGroups
      .flatMap((group) => group.permissions)
      .find((permission) => permission.key === "write_user_permissions")?.name ||
    "Write User Permissions";
  const [permissionValues, setPermissionValues] = useState<Record<string, boolean>>(
    () => getInitialPermissionValues(permissionGroups),
  );
  const [pendingPermissions, setPendingPermissions] = useState<
    Record<string, boolean>
  >({});

  const setPending = (permissionValueKey: string, isPending: boolean) => {
    setPendingPermissions((current) => {
      if (isPending) {
        return { ...current, [permissionValueKey]: true };
      }

      const next = { ...current };
      delete next[permissionValueKey];
      return next;
    });
  };

  const renderPermissionSwitch = ({
    checked,
    isDisabled,
    isPending,
    isSuperAdminManaged,
    onCheckedChange,
  }: {
    checked: boolean;
    isDisabled: boolean;
    isPending: boolean;
    isSuperAdminManaged: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => {
    const switchControl = (
      <div className="flex items-center gap-2 pt-0.5">
        {isPending ? <Spinner className="h-3.5 w-3.5" /> : null}
        <Switch
          checked={checked}
          disabled={isDisabled}
          onCheckedChange={onCheckedChange}
        />
      </div>
    );

    if (!isSuperAdminManaged) {
      return switchControl;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{switchControl}</span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {superAdminTooltipMessage}
        </TooltipContent>
      </Tooltip>
    );
  };

  const onTogglePermission = async (
    permission: AdminUserPermissionItem,
    permissionValueKey: string,
    nextValue: boolean,
    agentId?: string,
  ) => {
    const previousValue = permissionValues[permissionValueKey];

    setPermissionValues((current) => ({
      ...current,
      [permissionValueKey]: nextValue,
    }));
    setPending(permissionValueKey, true);

    const response = await saSetAdminUserPermission({
      adminUserId,
      permissionDefinitionId: permission.permissionDefinitionId,
      agentId,
      value: nextValue,
    });

    if (!response.success) {
      setPermissionValues((current) => ({
        ...current,
        [permissionValueKey]: previousValue,
      }));
      toast.error(response.error || `Failed to update ${permission.name}`);
      setPending(permissionValueKey, false);
      return;
    }

    toast.success(`${permission.name} updated`);
    setPending(permissionValueKey, false);
  };

  const renderPermissionAgentRow = (
    permission: AdminUserPermissionItem,
    agentValue: AdminUserPermissionAgentValue,
  ) => {
    const permissionValueKey = getPermissionValueKey(
      permission.permissionDefinitionId,
      agentValue.agentId,
    );
    const isGranted = Boolean(permissionValues[permissionValueKey]);
    const isPending = Boolean(pendingPermissions[permissionValueKey]);
    const isSuperAdminManaged =
      permission.requiresSuperAdminToManage && !isSuperAdmin;
    const isDisabled =
      isPending || !canWritePermissions || isSuperAdminManaged;

    return (
      <div
        key={agentValue.agentId}
        className={cn(
            "rounded-md border px-3 py-2.5 transition-colors",
          isGranted
            ? "bg-emerald-50/40 border-emerald-200/50"
            : "bg-rose-50/30 border-rose-200/40",
        )}
      >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <div className="text-sm font-medium leading-5">
                  {agentValue.agentName}
                </div>
                <span className="text-xs text-muted-foreground leading-4">
                  {agentValue.organisationName || "No organisation"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground leading-4">
                <span>
              Default: {permission.defaultValue ? "Enabled" : "Disabled"}
                </span>
                <span>
                  Effective: {isGranted ? "Granted" : "Not granted"}
                </span>
              </div>
          </div>

            {renderPermissionSwitch({
              checked: permissionValues[permissionValueKey],
              isDisabled,
              isPending,
              isSuperAdminManaged,
              onCheckedChange: (checked) =>
                onTogglePermission(
                  permission,
                  permissionValueKey,
                  checked,
                  agentValue.agentId,
                ),
            })}
        </div>

        {permission.globalExplicitValue !== null ? (
          <div className="mt-2 text-xs text-muted-foreground leading-4">
            A global override is set for this permission and currently affects
            all agents.
          </div>
        ) : null}

      </div>
    );
  };

  const renderPermission = (permission: AdminUserPermissionItem) => {
    if (permission.scopeMode === "agent") {
      return (
        <div className="space-y-2" key={permission.permissionDefinitionId}>
          <div className="space-y-0.5 px-0.5">
            <div className="text-sm font-medium leading-5">
              {permission.name}
            </div>
            <p className="text-xs text-muted-foreground leading-4">
              {permission.description}
            </p>
          </div>

          {permission.agentValues.length === 0 ? (
            <div className="rounded-md border border-dashed px-3 py-2.5 text-xs text-muted-foreground leading-4">
              No accessible agents were found for this user.
            </div>
          ) : (
            permission.agentValues.map((agentValue) =>
              renderPermissionAgentRow(permission, agentValue),
            )
          )}
        </div>
      );
    }

    if (permission.scopeMode !== "global") {
      return (
        <div
          key={permission.permissionDefinitionId}
          className="rounded-md border border-dashed px-3 py-2.5"
        >
          <div className="text-sm font-medium leading-5">{permission.name}</div>
          <p className="mt-0.5 text-xs text-muted-foreground leading-4">
            {permission.description}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-4">
            This permission uses an unsupported scope mode and is shown read-only.
          </p>
        </div>
      );
    }

    const permissionValueKey = getPermissionValueKey(
      permission.permissionDefinitionId,
    );
    const isGranted = Boolean(permissionValues[permissionValueKey]);
    const isPending = Boolean(pendingPermissions[permissionValueKey]);
    const isSuperAdminManaged =
      permission.requiresSuperAdminToManage && !isSuperAdmin;
    const isDisabled = isPending || !canWritePermissions || isSuperAdminManaged;

    return (
      <div
        key={permission.permissionDefinitionId}
        className={cn(
          "rounded-md border px-3 py-2.5 transition-colors",
          isGranted
            ? "bg-emerald-50/40 border-emerald-200/50"
            : "bg-rose-50/30 border-rose-200/40",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm font-medium leading-5">{permission.name}</div>
            <p className="text-xs text-muted-foreground leading-4">
              {permission.description}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground leading-4">
              <span>
              Default: {permission.defaultValue ? "Enabled" : "Disabled"}
              </span>
              <span>
                Effective: {isGranted ? "Granted" : "Not granted"}
              </span>
            </div>
          </div>

          {renderPermissionSwitch({
            checked: permissionValues[permissionValueKey],
            isDisabled,
            isPending,
            isSuperAdminManaged,
            onCheckedChange: (checked) =>
              onTogglePermission(permission, permissionValueKey, checked),
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <H2>Permissions</H2>
        <p className="text-sm text-muted-foreground leading-5">
          View and manage this user&apos;s grouped permissions.
        </p>
      </div>

      {!canWritePermissions ? (
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>Read-only access</AlertTitle>
          <AlertDescription>
            You can view these permissions, but only super admins or users with
            {` ${writeUserPermissionsName} `}
            can change them.
          </AlertDescription>
        </Alert>
      ) : null}

      {permissionGroups.length === 0 ? (
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 py-4">
            <CardTitle>No permissions configured</CardTitle>
            <CardDescription>
              No permission groups or definitions were found in the database.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {permissionGroups.map((group) => (
        <Card key={group.id} className="gap-0 py-0">
          <CardHeader className="gap-1 px-5 py-4">
            <CardTitle className="text-base leading-6">{group.name}</CardTitle>
            <CardDescription className="text-xs leading-4">
              {group.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-5 pb-5">
            {group.permissions.map((permission) => renderPermission(permission))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}