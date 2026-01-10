"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

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
  const existingUser = await db("adminUser")
    .select("adminUser.*", "organisation.partnerId as orgPartnerId")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .where("adminUser.id", adminUserId)
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  // Partners can only update users belonging to their organisations
  if (accessToken.partner && !accessToken.superAdmin) {
    if (existingUser.orgPartnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You do not have permission to update this user.",
      };
    }

    // If changing organisation, verify new organisation also belongs to the partner
    if (organisationId && organisationId !== existingUser.organisationId) {
      const newOrg = await db("organisation")
        .where("id", organisationId)
        .first();
      if (!newOrg || newOrg.partnerId !== accessToken.partnerId) {
        return {
          success: false,
          error:
            "You can only assign users to organisations within your partner.",
        };
      }
    }

    // Partners cannot set partnerId on the admin user
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
