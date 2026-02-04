"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export interface WabaDbRecord {
  id: string;
  metaId: string;
  metaBusinessId: string | null;
  name: string;
  status: string;
  ownershipType: string;
  businessVerificationStatus: string;
  accountReviewStatus: string;
  messageTemplateNamespace: string;
  marketingMessagesLiteApiStatus: string;
  marketingMessagesOnboardingStatus: string;
  healthStatus: {
    can_send_message?: string;
    entities?: {
      entity_type: string;
      id: string;
      can_send_message: string;
      errors?: {
        error_code: number;
        error_description: string;
        possible_solution: string;
      }[];
    }[];
  };
  timezoneId: string;
  isEnabledForInsights: boolean;
  subscribedApps: {
    data?: {
      whatsapp_business_api_data: {
        name: string;
        id: string;
        category?: string;
        link?: string;
      };
    }[];
  };
  appId?: string;
  appName?: string;
  businessName?: string;
}

interface GetWabaByIdResponse {
  success: boolean;
  data?: WabaDbRecord;
  error?: string;
}

const saGetWabaById = async (wabaId: string): Promise<GetWabaByIdResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can access WABA details
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Unauthorized: Only super admins can access WABA details",
    };
  }

  const waba = await db("waba")
    .leftJoin("metaBusiness", "waba.metaBusinessId", "metaBusiness.id")
    .leftJoin("metaApp", "waba.appId", "metaApp.id")
    .select("waba.*")
    .select("metaBusiness.name as businessName")
    .select("metaApp.name as appName")
    .where("waba.id", wabaId)
    .first();

  if (!waba) {
    return {
      success: false,
      error: "WABA not found",
    };
  }

  return {
    success: true,
    data: waba,
  };
};

export default saGetWabaById;
