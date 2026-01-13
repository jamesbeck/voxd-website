"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

// Helper to strip protocol from URL
const stripProtocol = (url: string): string => {
  return url.replace(/^(https?:\/\/)/i, "");
};

const saUpdateOrganisation = async ({
  organisationId,
  name,
  webAddress,
}: {
  organisationId: string;
  name: string;
  webAddress?: string;
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

  // Strip protocol from web address if provided
  const cleanWebAddress = webAddress ? stripProtocol(webAddress) : null;

  //update the organisation
  await db("organisation")
    .where({ id: organisationId })
    .update({
      name,
      partnerId: accessToken.partnerId || null,
      webAddress: cleanWebAddress,
    });

  // Log organisation update
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Organisation Updated",
    description: `Organisation "${name}" updated`,
    organisationId,
    partnerId: accessToken.partnerId,
    data: {
      previousName: existingOrganisation.name,
      newName: name,
      previousWebAddress: existingOrganisation.webAddress,
      newWebAddress: cleanWebAddress,
    },
  });

  return { success: true };
};

export { saUpdateOrganisation };
