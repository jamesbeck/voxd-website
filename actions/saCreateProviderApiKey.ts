"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

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

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  if (!key || !providerId || !organisationId) {
    return { success: false, error: "All fields are required" };
  }

  const [newKey] = await db("providerApiKey")
    .insert({ key, providerId, organisationId })
    .returning("*");

  return { success: true, data: newKey };
};

export { saCreateProviderApiKey };
