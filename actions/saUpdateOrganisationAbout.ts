"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";
import db from "@/database/db";

export interface UpdateOrganisationAboutResponse {
  success: boolean;
  error?: string;
}

const saUpdateOrganisationAbout = async ({
  organisationId,
  about,
}: {
  organisationId: string;
  about: string;
}): Promise<UpdateOrganisationAboutResponse> => {
  const token = await verifyAccessToken();

  // Verify the organisation exists and user has access
  const organisation = await db("organisation")
    .where({ id: organisationId })
    .first();

  if (!organisation) {
    return {
      success: false,
      error: "Organisation not found",
    };
  }

  // Authorization check: must be super admin, partner of this org, or member
  const isSuperAdmin = token.superAdmin;
  const isPartnerOfOrg =
    token.partnerId && organisation.partnerId === token.partnerId;
  const isMemberOfOrg = token.organisationId === organisation.id;

  if (!isSuperAdmin && !isPartnerOfOrg && !isMemberOfOrg) {
    return {
      success: false,
      error: "You do not have permission to edit this organisation",
    };
  }

  try {
    await db("organisation").where({ id: organisationId }).update({
      about,
    });

    await addLog({
      adminUserId: token.adminUserId,
      organisationId,
      event: "ORGANISATION_ABOUT_UPDATED",
      data: {
        organisationId,
        aboutLength: about.length,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating organisation about:", error);
    return {
      success: false,
      error: "Failed to update organisation about",
    };
  }
};

export default saUpdateOrganisationAbout;
