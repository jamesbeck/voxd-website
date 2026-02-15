"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const saMoveOrganisationToPartner = async ({
  organisationId,
  partnerId,
}: {
  organisationId: string;
  partnerId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const organisation = await db("organisation")
      .where({ id: organisationId })
      .select("id", "name", "partnerId")
      .first();

    if (!organisation) {
      return { success: false, error: "Organisation not found" };
    }

    const partner = await db("partner")
      .where({ id: partnerId })
      .select("id", "name")
      .first();

    if (!partner) {
      return { success: false, error: "Partner not found" };
    }

    const oldPartnerId = organisation.partnerId;

    if (oldPartnerId === partnerId) {
      return {
        success: false,
        error: "Organisation is already assigned to this partner",
      };
    }

    // Get old partner name for logging
    let oldPartnerName = "None";
    if (oldPartnerId) {
      const oldPartner = await db("partner")
        .where({ id: oldPartnerId })
        .select("name")
        .first();
      if (oldPartner) oldPartnerName = oldPartner.name;
    }

    await db("organisation")
      .where({ id: organisationId })
      .update({ partnerId });

    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "Organisation Moved to Partner",
      description: `Organisation "${organisation.name}" moved from "${oldPartnerName}" to "${partner.name}"`,
      organisationId,
      partnerId,
      data: {
        oldPartnerId,
        newPartnerId: partnerId,
        oldPartnerName,
        newPartnerName: partner.name,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error moving organisation to partner:", error);
    return { success: false, error: "Failed to move organisation to partner" };
  }
};

export default saMoveOrganisationToPartner;
