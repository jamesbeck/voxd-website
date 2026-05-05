"use server";

import db from "@/database/db";
import {
  applyAdminUserScope,
} from "@/lib/adminUserAccess";
import { hasAdminUserPermission } from "@/lib/adminUserPermissions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saDeleteUser = async ({
  userId,
}: {
  userId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();
  const canWriteUsers =
    accessToken.superAdmin ||
    (await hasAdminUserPermission({
      adminUserId: accessToken.adminUserId,
      permissionKey: "write_users",
    }));

  if (!canWriteUsers) {
    return { success: false, error: "Unauthorized" };
  }

  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  const existingUserQuery = db("adminUser")
    .select("adminUser.id")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .where("adminUser.id", userId);

  applyAdminUserScope(existingUserQuery, accessToken);

  const existingUser = await existingUserQuery.first();

  if (!existingUser) {
    return { success: false, error: "User not found" };
  }

  await db("adminUser").delete().where({ id: userId });

  return { success: true };
};

export default saDeleteUser;
