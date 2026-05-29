"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  resolveTemplateParameterValues,
  TemplateParameterMappings,
} from "@/lib/templateMessages";
import {
  createTemplateMessageSendRecord,
  sendTemplateMessage,
} from "@/lib/templateMessageSend";
import { getChatUsersForSavedTemplateSendGroup } from "@/lib/templateSendGroups";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ServerActionResponse } from "@/types/types";

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

  const groupResult = await getChatUsersForSavedTemplateSendGroup({
    agentId,
    queryId,
  });

  if (!groupResult.success) {
    return { success: false, error: groupResult.error };
  }

  if (groupResult.chatUsers.length === 0) {
    return {
      success: false,
      error:
        groupResult.excludedUsersWithoutWhatsApp > 0
          ? "Saved group has no recipients with a WhatsApp number"
          : "Saved group has no matching users",
    };
  }

  const agent = await db("agent")
    .where("agent.id", agentId)
    .select("agent.phoneNumberId")
    .first();

  if (!agent?.phoneNumberId) {
    return { success: false, error: "Agent has no phone number" };
  }

  const phoneNumber = await db("phoneNumber")
    .where("phoneNumber.id", agent.phoneNumberId)
    .select("phoneNumber.wabaId")
    .first();

  if (!phoneNumber?.wabaId) {
    return { success: false, error: "Phone number has no WABA" };
  }

  const template = await db("waTemplate")
    .where("waTemplate.id", templateId)
    .select("waTemplate.id", "waTemplate.wabaId")
    .first();

  if (!template) {
    return { success: false, error: "Template not found" };
  }

  if (template.wabaId !== phoneNumber.wabaId) {
    return { success: false, error: "Template does not belong to this agent" };
  }

  const representativeChatUserId = groupResult.chatUsers[0]?.id || null;
  const sendRecord = await createTemplateMessageSendRecord({
    agentId,
    phoneNumberId: agent.phoneNumberId,
    templateId,
    selectedChatUserId: representativeChatUserId,
    createdByAdminUserId: accessToken.adminUserId,
    mapping: mappings,
    queryId,
    querySnapshot: groupResult.query.query,
    recipientCount: groupResult.chatUsers.length,
  });

  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  for (const chatUser of groupResult.chatUsers) {
    const resolvedValues = resolveTemplateParameterValues(mappings, chatUser);
    const sendResult = await sendTemplateMessage({
      chatUserId: chatUser.id,
      templateId,
      parameterValues: resolvedValues,
      templateMessageSendId: sendRecord.id,
    });

    if (sendResult.success) {
      successCount += 1;
      continue;
    }

    failureCount += 1;
    if (sendResult.error) {
      errors.push(sendResult.error);
    }
  }

  if (successCount === 0) {
    return {
      success: false,
      error: errors[0] || "Failed to send template to saved group",
    };
  }

  return {
    success: true,
    data: {
      templateMessageSendId: sendRecord.id,
      successCount,
      failureCount,
      recipientCount: groupResult.chatUsers.length,
      excludedUsersWithoutWhatsApp: groupResult.excludedUsersWithoutWhatsApp,
      queryName: groupResult.query.name,
      partialFailure:
        failureCount > 0
          ? errors[0] || "Some recipients could not be sent the template."
          : undefined,
      storageWarning: sendRecord.storageEnabled
        ? undefined
        : "Parent template send storage is not available until the upstream schema is deployed.",
    },
  };
};

export default saSendAgentTemplateMessage;
