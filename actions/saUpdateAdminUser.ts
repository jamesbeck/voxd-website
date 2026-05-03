"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import {
  applyAdminUserScope,
  getAccessibleOrganisationForAdminUsers,
} from "@/lib/adminUserAccess";

const saUpdateAdminUser = async ({
  adminUserId,
  name,
  email,
  partnerId,
  organisationId,
}: {
  adminUserId: string;
  name?: string;
  email?: string;
  partnerId?: string;
  organisationId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins and partners can update admin users
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "You do not have permission to update users.",
    };
  }

  if (!adminUserId) {
    return {
      success: false,
      error: "Admin User ID is required",
    };
  }

  //find the existing user
  const existingUserQuery = db("adminUser")
    .select("adminUser.*", "organisation.partnerId as orgPartnerId")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .where("adminUser.id", adminUserId);

  applyAdminUserScope(existingUserQuery, accessToken);

  const existingUser = await existingUserQuery.first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  if (!accessToken.superAdmin && !organisationId) {
    return {
      success: false,
      error: "Admin users must belong to an organisation.",
    };
  }

  if (organisationId && organisationId !== existingUser.organisationId) {
    const accessibleOrganisation = await getAccessibleOrganisationForAdminUsers({
      organisationId,
      accessToken,
    });

    if (!accessibleOrganisation) {
      return {
        success: false,
        error:
          "You can only assign users to your organisation or organisations your partner manages.",
      };
    }
  }

  if (!accessToken.superAdmin) {
    partnerId = undefined;
  }

  //update the user
  await db("adminUser")
    .where({ id: adminUserId })
    .update({
      name,
      email: email?.toLowerCase(),
      ...(accessToken.superAdmin && { partnerId: partnerId || null }),
      organisationId: organisationId || null,
    });

  return { success: true };
};

export { saUpdateAdminUser };
