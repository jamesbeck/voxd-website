"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { TemplateParameterMappings } from "@/lib/templateMessages";
import { postInternalAdminApi } from "@/lib/internalAdminApi";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ServerActionResponse } from "@/types/types";

type TemplateApiError = {
  success: false;
  error: string;
  errorCode: string;
  data?: Record<string, unknown>;
};

type GroupTemplateSuccess = {
  success: true;
  data: {
    templateMessageSendId: string;
    successCount: number;
    failureCount: number;
    recipientCount: number;
    excludedUsersWithoutWhatsApp: number;
    queryName: string;
    partialFailure?: string;
    storageWarning?: string;
  };
};

type GroupTemplateResponse = GroupTemplateSuccess | TemplateApiError;

const saSendAgentTemplateMessage = async ({
  agentId,
  queryId,
  templateId,
  mappings,
}: {
  agentId: string;
  queryId: string;
  templateId: string;
  mappings: TemplateParameterMappings;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const response = await postInternalAdminApi<GroupTemplateResponse>({
      path: "/api/admin/sendGroupTemplateMessage",
      body: {
        agentId,
        queryId,
        templateId,
        mappings,
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
      return {
        success: false,
        error: "Failed to send template to saved group",
      };
    }

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.error || "Failed to send template to saved group",
      };
    }

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error sending group template message:", error);
    return { success: false, error: "Failed to send template to saved group" };
  }
};

export default saSendAgentTemplateMessage;
