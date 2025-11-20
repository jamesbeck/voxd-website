"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateAdminUser = async ({
  adminUserId,
  name,
  email,
  partnerId,
  organisationIds,
}: {
  adminUserId: string;
  name?: string;
  email?: string;
  partnerId?: string;
  organisationIds?: string[];
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.admin)
    return {
      success: false,
      error: "You do not have permission to update users.",
    };

  if (!adminUserId) {
    return {
      success: false,
      error: "Admin User ID is required",
    };
  }

  //find the existing user
  const existingUser = await db("adminUser")
    .select("*")
    .where({ id: adminUserId })
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  //update the user
  await db("adminUser")
    .where({ id: adminUserId })
    .update({
      name,
      email: email?.toLowerCase(),
      partnerId: partnerId || null,
    });

  //update organisation associations
  if (organisationIds) {
    //delete existing associations
    await db("organisationUser").where({ adminUserId }).del();

    //create new associations
    if (organisationIds.length > 0) {
      const userOrganisationAssociations = organisationIds.map(
        (organisationId) => ({
          adminUserId,
          organisationId,
        })
      );

      await db("organisationUser").insert(userOrganisationAssociations);
    }
  }

  return { success: true };
};

export { saUpdateAdminUser };
