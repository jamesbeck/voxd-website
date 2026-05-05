import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PermissionDefinitionAdminUsersTable from "./PermissionDefinitionAdminUsersTable";

export default function PermissionDefinitionAdminUsersTab({
  permissionDefinitionId,
  scopeMode,
}: {
  permissionDefinitionId: string;
  scopeMode: string;
}) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Permission Status</AlertTitle>
        <AlertDescription>
          {scopeMode === "agent"
            ? "Agent-scoped permissions are summarised per admin user. Global overrides still take precedence over agent-specific overrides."
            : "Global permissions show each admin user&apos;s effective Granted or Not granted status."}
        </AlertDescription>
      </Alert>
      <PermissionDefinitionAdminUsersTable
        permissionDefinitionId={permissionDefinitionId}
      />
    </div>
  );
}
