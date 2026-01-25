"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export type PhoneNumberDetails = {
  id: string;
  wabaId: string | null;
  metaId: string;
  accountMode: string;
  status: string;
  displayPhoneNumber: string;
  healthStatus: {
    entities: Array<{
      id: string;
      entity_type: string;
      can_send_message: string;
      errors?: Array<{
        error_code: string;
        error_description: string;
        possible_solution: string;
      }>;
    }>;
  };
  messagingLimitTier: string | null;
  nameStatus: string;
  qualityScore: Record<string, unknown> | null;
  verifiedName: string | null;
  platformType: string;
  webhookConfiguration: Record<string, unknown> | null;
  wabaName?: string | null;
  appName?: string | null;
};

const saGetPhoneNumberById = async ({
  phoneNumberId,
}: {
  phoneNumberId: string;
}): Promise<{
  success: boolean;
  data?: PhoneNumberDetails;
  error?: string;
}> => {
  await verifyAccessToken();

  const phoneNumber = await db("phoneNumber")
    .leftJoin("waba", "phoneNumber.wabaId", "waba.id")
    .leftJoin("app", "waba.appId", "app.id")
    .select("phoneNumber.*", "waba.name as wabaName", "app.name as appName")
    .where("phoneNumber.id", phoneNumberId)
    .first();

  if (!phoneNumber) {
    return {
      success: false,
      error: "Phone number not found",
    };
  }

  return {
    success: true,
    data: phoneNumber as PhoneNumberDetails,
  };
};

export default saGetPhoneNumberById;
