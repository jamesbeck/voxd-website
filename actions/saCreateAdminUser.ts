"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { getAccessibleOrganisationForAdminUsers } from "@/lib/adminUserAccess";

const saCreateAdminUser = async ({
  name,
  email,
  organisationId,
}: {
  name: string;
  email?: string;
  organisationId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "You do not have permission to create users.",
    };
  }

  if (!accessToken.superAdmin && !organisationId) {
    return {
      success: false,
      error: "Admin users must belong to an organisation.",
    };
  }

  if (organisationId) {
    const accessibleOrganisation = await getAccessibleOrganisationForAdminUsers(
      {
        organisationId,
        accessToken,
      },
    );

    if (!accessibleOrganisation) {
      return {
        success: false,
        error:
          "You do not have permission to create a user for this organisation.",
      };
    }
  }

  //check user number and email is unique
  const existingUser = await db("adminUser")
    .select("*")
    .orWhere(function () {
      this.where("email", email).whereNotNull("email").where("email", "!=", "");
    })
    .first();

  if (existingUser) {
    return {
      success: false,
      error: "User already exists with email",
    };
  }

  //create a new user
  const [newAdminUser] = await db("adminUser")
    .insert({
      name,
      email: email?.toLowerCase(),
      organisationId: organisationId || null,
    })
    .returning("id");

  return { success: true, data: newAdminUser };
};

export { saCreateAdminUser };
