"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewOrganisation from "@/lib/organisationAccess";
import { addLog } from "@/lib/addLog";
import db from "@/database/db";

export interface UpdateOrganisationBillingResponse {
  success: boolean;
  error?: string;
}

const emptyToNull = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
};

const normalizeCommaSeparatedEmails = (value: string) => {
  const normalizedValue = value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");

  return emptyToNull(normalizedValue);
};

const saUpdateOrganisationBilling = async ({
  organisationId,
  billingAddress,
  billingPostcode,
  billingEmails,
  gcMandateId,
}: {
  organisationId: string;
  billingAddress: string;
  billingPostcode: string;
  billingEmails: string;
  gcMandateId: string;
}): Promise<UpdateOrganisationBillingResponse> => {
  const accessToken = await verifyAccessToken();

  const organisation = await db("organisation")
    .where({ id: organisationId })
    .first();

  if (!organisation) {
    return {
      success: false,
      error: "Organisation not found",
    };
  }

  const canViewOrganisation = await userCanViewOrganisation({
    organisationId,
    accessToken,
  });
  const isMemberOfOrganisation = accessToken.organisationId === organisationId;

  if (
    !canViewOrganisation ||
    (!accessToken.superAdmin && !accessToken.partner && !isMemberOfOrganisation)
  ) {
    return {
      success: false,
      error: "You do not have permission to edit this organisation",
    };
  }

  try {
    const updateData = {
      billingAddress: emptyToNull(billingAddress),
      billingPostcode: emptyToNull(billingPostcode),
      billingEmails: normalizeCommaSeparatedEmails(billingEmails),
      gcMandateId: emptyToNull(gcMandateId),
    };

    await db("organisation").where({ id: organisationId }).update(updateData);

    await addLog({
      adminUserId: accessToken.adminUserId,
      organisationId,
      event: "ORGANISATION_BILLING_UPDATED",
      data: {
        organisationId,
        ...updateData,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating organisation billing:", error);
    return {
      success: false,
      error: "Failed to update organisation billing",
    };
  }
};

export default saUpdateOrganisationBilling;
