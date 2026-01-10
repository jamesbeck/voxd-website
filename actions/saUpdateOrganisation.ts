"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateOrganisation = async ({
  organisationId,
  name,
}: {
  organisationId: string;
  name: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admin users or users with a partnerId can edit organisations
  if (!accessToken.superAdmin && !accessToken.partnerId) {
    return {
      success: false,
      error: "You do not have permission to edit organisations",
    };
  }

  if (!organisationId) {
    return {
      success: false,
      error: "Organisation ID is required",
    };
  }

  //find the existing organisation
  const existingOrganisation = await db("organisation")
    .select("*")
    .where({ id: organisationId })
    .first();

  if (!existingOrganisation) {
    return {
      success: false,
      error: "Organisation not found",
    };
  }

  //update the organisation
  await db("organisation")
    .where({ id: organisationId })
    .update({ name, partnerId: accessToken.partnerId || null });

  return { success: true };
};

export { saUpdateOrganisation };
