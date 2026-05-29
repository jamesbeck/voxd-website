"use server";

import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { sendTemplateMessage } from "@/lib/templateMessageSend";

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
    return sendTemplateMessage({
      chatUserId: userId,
      templateId,
      parameterValues,
    });
  } catch (error) {
    console.error("Error sending template message:", error);
    return { success: false, error: "Failed to send template message" };
  }
};

export default saSendTemplateMessage;
