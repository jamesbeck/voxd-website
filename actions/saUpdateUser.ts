"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateUser = async ({
  userId,
  name,
  number,
  email,
  partnerId,
  testingAgentId,
  organisationIds,
}: {
  userId: string;
  name?: string;
  number?: string;
  email?: string;
  partnerId?: string;
  testingAgentId?: string;
  organisationIds?: string[];
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.admin)
    return {
      success: false,
      error: "You do not have permission to update users.",
    };

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
    };
  }

  //find the existing user
  const existingUser = await db("user")
    .select("*")
    .where({ id: userId })
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  //update the user
  await db("user")
    .where({ id: userId })
    .update({
      name,
      number,
      email,
      partnerId: partnerId || null,
      testingAgentId: testingAgentId || null,
    });

  //update organisation associations
  if (organisationIds) {
    //delete existing associations
    await db("organisationUser").where({ userId }).del();

    //create new associations
    if (organisationIds.length > 0) {
      const userOrganisationAssociations = organisationIds.map(
        (organisationId) => ({
          userId: userId,
          organisationId: organisationId,
        })
      );

      await db("organisationUser").insert(userOrganisationAssociations);
    }
  }

  return { success: true };
};

export { saUpdateUser };
