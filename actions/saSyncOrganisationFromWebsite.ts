"use server";

import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";
import syncOrganisationFromWebsite from "@/lib/syncOrganisationFromWebsite";
import db from "../database/db";

const saSyncOrganisationFromWebsite = async ({
  organisationId,
}: {
  organisationId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admin users or users with a partnerId can sync organisations
  if (!accessToken.superAdmin && !accessToken.partnerId) {
    return {
      success: false,
      error: "You do not have permission to sync organisations",
    };
  }

  if (!organisationId) {
    return {
      success: false,
      error: "Organisation ID is required",
    };
  }

  // Get the organisation
  const organisation = await db("organisation")
    .select("id", "name", "webAddress", "partnerId")
    .where({ id: organisationId })
    .first();

  if (!organisation) {
    return {
      success: false,
      error: "Organisation not found",
    };
  }

  // Check user can access this organisation
  if (
    !accessToken.superAdmin &&
    accessToken.partnerId !== organisation.partnerId
  ) {
    return {
      success: false,
      error: "You do not have permission to sync this organisation",
    };
  }

  if (!organisation.webAddress) {
    return {
      success: false,
      error: "Organisation has no web address configured",
    };
  }

  const result = await syncOrganisationFromWebsite({
    organisationId,
    webAddress: organisation.webAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to sync from website",
    };
  }

  // Log the sync
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Organisation Synced from Website",
    description: `Organisation "${organisation.name}" synced from website`,
    organisationId,
    partnerId: organisation.partnerId,
    data: {
      webAddress: organisation.webAddress,
      aboutLength: result.about?.length,
    },
  });

  return {
    success: true,
    data: { about: result.about },
  };
};

export { saSyncOrganisationFromWebsite };
