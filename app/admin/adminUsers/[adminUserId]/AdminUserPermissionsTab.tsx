import {
  getAdminUserPermissionsAccess,
  getGroupedAdminUserPermissions,
} from "@/lib/adminUserPermissions";
import { AccessTokenPayload } from "@/types/tokenTypes";
import AdminUserPermissionsTabClient from "./AdminUserPermissionsTabClient";

export default async function AdminUserPermissionsTab({
  adminUserId,
  accessToken,
}: {
  adminUserId: string;
  accessToken: AccessTokenPayload;
}) {
  const [access, permissionGroups] = await Promise.all([
    getAdminUserPermissionsAccess({
      targetAdminUserId: adminUserId,
      accessToken,
    }),
    getGroupedAdminUserPermissions({ adminUserId }),
  ]);

  if (!access) {
    return null;
  }

  return (
    <AdminUserPermissionsTabClient
      adminUserId={adminUserId}
      canWritePermissions={access.canWritePermissions}
      isSuperAdmin={access.accessToken.superAdmin}
      permissionGroups={permissionGroups}
    />
  );
}
