"use server";

import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { postInternalAdminApi } from "@/lib/internalAdminApi";

type TemplateApiError = {
  success: false;
  error: string;
  errorCode: string;
  data?: Record<string, unknown>;
};

type IndividualTemplateSuccess = {
  success: true;
  data: {
    messageId: string | null;
    attemptRecorded: true;
  };
};

type IndividualTemplateResponse = IndividualTemplateSuccess | TemplateApiError;

const saSendTemplateMessage = async ({
  userId,
  templateId,
  parameterValues,
}: {
  userId: string;
  templateId: string;
  parameterValues: Record<string, string>;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const response = await postInternalAdminApi<IndividualTemplateResponse>({
      path: "/api/admin/sendTemplateMessage",
      body: {
        userId,
        templateId,
        parameterValues,
        requestedByAdminUserId: accessToken.adminUserId,
      },
    });

    if (response.status === 401) {
      return {
        success: false,
        error: "Internal template API authentication failed",
      };
    }

    if (response.status >= 500) {
      return {
        success: false,
        error: response.error || "Template send service failed",
      };
    }

    if (!response.data) {
      return { success: false, error: "Failed to send template message" };
    }

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.error || "Failed to send template message",
      };
    }

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error sending template message:", error);
    return { success: false, error: "Failed to send template message" };
  }
};

export default saSendTemplateMessage;
