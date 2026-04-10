"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateProviderApiKey = async ({
  providerApiKeyId,
  key,
  providerId,
}: {
  providerApiKeyId: string;
  key?: string;
  providerId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  if (!providerApiKeyId) {
    return { success: false, error: "Provider API Key ID is required" };
  }

  const existing = await db("providerApiKey")
    .where({ id: providerApiKeyId })
    .first();

  if (!existing) {
    return { success: false, error: "Provider API Key not found" };
  }

  const updateData: Record<string, unknown> = {};
  if (key !== undefined) updateData.key = key;
  if (providerId !== undefined) updateData.providerId = providerId;

  await db("providerApiKey").where({ id: providerApiKeyId }).update(updateData);

  return { success: true };
};

export { saUpdateProviderApiKey };
