"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewOrganisation from "@/lib/organisationAccess";

const saCreateProviderApiKey = async ({
  key,
  providerId,
  organisationId,
}: {
  key: string;
  providerId: string;
  organisationId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!key || !providerId || !organisationId) {
    return { success: false, error: "All fields are required" };
  }

  const canViewOrganisation = await userCanViewOrganisation({
    organisationId,
    accessToken,
  });

  if (!canViewOrganisation) {
    return { success: false, error: "Unauthorized" };
  }

  const [newKey] = await db("providerApiKey")
    .insert({ key, providerId, organisationId })
    .returning("*");

  return { success: true, data: newKey };
};

export { saCreateProviderApiKey };
