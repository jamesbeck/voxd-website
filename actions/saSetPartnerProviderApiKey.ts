"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewOrganisation from "@/lib/organisationAccess";
import { ServerActionResponse } from "@/types/types";

const saSetPartnerProviderApiKey = async ({
  partnerId,
  providerApiKeyId,
}: {
  partnerId: string;
  providerApiKeyId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!partnerId || !providerApiKeyId) {
    return {
      success: false,
      error: "Partner and provider API key are required",
    };
  }

  const partner = await db("organisation")
    .select("id", "partner")
    .where({ id: partnerId })
    .first();

  if (!partner) {
    return {
      success: false,
      error: "Partner not found",
    };
  }

  if (!partner.partner) {
    return {
      success: false,
      error: "This organisation is not a partner",
    };
  }

  const canViewOrganisation = await userCanViewOrganisation({
    organisationId: partnerId,
    accessToken,
  });

  if (!canViewOrganisation) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const providerApiKey = await db("providerApiKey")
    .select("id", "organisationId")
    .where({ id: providerApiKeyId })
    .first();

  if (!providerApiKey) {
    return {
      success: false,
      error: "Provider API key not found",
    };
  }

  if (providerApiKey.organisationId !== partnerId) {
    return {
      success: false,
      error: "You can only use API keys from this organisation",
    };
  }

  await db("organisation").where({ id: partnerId }).update({
    providerApiKeyId,
  });

  return {
    success: true,
  };
};

export default saSetPartnerProviderApiKey;