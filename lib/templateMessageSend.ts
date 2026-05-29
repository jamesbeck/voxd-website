import db from "@/database/db";
import { ServerActionResponse } from "@/types/types";

type TemplateParameterValue = {
  type: "text";
  text: string;
  parameter_name?: string;
};

type TemplateComponentPayload = {
  type: "header" | "body";
  parameters?: TemplateParameterValue[];
};

function isMissingSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  return code === "42P01" || code === "42703";
}

async function getAccessTokenForPhoneNumberMetaId(
  metaId: string,
): Promise<string | null> {
  const phoneNumber = await db("phoneNumber").where({ metaId }).first();

  if (phoneNumber?.wabaId) {
    const waba = await db("waba").where({ id: phoneNumber.wabaId }).first();

    if (waba?.appId) {
      const app = await db("metaApp").where({ id: waba.appId }).first();
      if (app?.accessToken) {
        return app.accessToken;
      }
    }
  }

  return null;
}

function buildTemplateComponents(
  templateData: any,
  parameterValues: Record<string, string>,
) {
  const components: TemplateComponentPayload[] = [];
  const isNamed = templateData?.parameter_format === "NAMED";

  for (const component of templateData?.components || []) {
    if (component.type === "HEADER" && component.format === "TEXT") {
      const headerParams: TemplateParameterValue[] = [];

      if (isNamed && component.example?.body_text_named_params) {
        for (const parameter of component.example.body_text_named_params) {
          if (parameterValues[parameter.param_name]) {
            headerParams.push({
              type: "text",
              parameter_name: parameter.param_name,
              text: parameterValues[parameter.param_name],
            });
          }
        }
      } else if (component.example?.header_text) {
        component.example.header_text.forEach((_: string, index: number) => {
          const key = `header_${index + 1}`;
          if (parameterValues[key]) {
            headerParams.push({
              type: "text",
              text: parameterValues[key],
            });
          }
        });
      }

      if (headerParams.length > 0) {
        components.push({
          type: "header",
          parameters: headerParams,
        });
      }
    }

    if (component.type === "BODY") {
      const bodyParams: TemplateParameterValue[] = [];

      if (isNamed && component.example?.body_text_named_params) {
        for (const parameter of component.example.body_text_named_params) {
          if (parameterValues[parameter.param_name]) {
            bodyParams.push({
              type: "text",
              parameter_name: parameter.param_name,
              text: parameterValues[parameter.param_name],
            });
          }
        }
      } else if (component.example?.body_text) {
        const bodyTextParams = component.example.body_text[0] || [];
        bodyTextParams.forEach((_: string, index: number) => {
          const key = `body_${index + 1}`;
          if (parameterValues[key]) {
            bodyParams.push({
              type: "text",
              text: parameterValues[key],
            });
          }
        });
      }

      if (bodyParams.length > 0) {
        components.push({
          type: "body",
          parameters: bodyParams,
        });
      }
    }
  }

  return components;
}

async function insertTemplateSendAttempt({
  chatUserId,
  templateId,
  success,
  metaResponse,
  error,
  templateMessageSendId,
  resolvedValues,
}: {
  chatUserId: string;
  templateId: string;
  success: boolean;
  metaResponse?: unknown;
  error?: string;
  templateMessageSendId?: string | null;
  resolvedValues?: Record<string, string>;
}) {
  const baseAttempt = {
    chatUserId,
    templateId,
    success,
    metaResponse: metaResponse || null,
    error: error || null,
  };

  try {
    await db("templateMessageSendAttempt").insert({
      ...baseAttempt,
      templateMessageSendId: templateMessageSendId || null,
      resolvedValues: resolvedValues || null,
    });
  } catch (insertError) {
    if (!isMissingSchemaError(insertError)) {
      throw insertError;
    }

    await db("templateMessageSendAttempt").insert(baseAttempt);
  }
}

export async function createTemplateMessageSendRecord({
  agentId,
  phoneNumberId,
  templateId,
  selectedChatUserId,
  createdByAdminUserId,
  mapping,
  queryId,
  querySnapshot,
  recipientCount,
}: {
  agentId: string;
  phoneNumberId: string;
  templateId: string;
  selectedChatUserId?: string | null;
  createdByAdminUserId: string;
  mapping: Record<string, unknown>;
  queryId?: string | null;
  querySnapshot?: unknown;
  recipientCount?: number | null;
}) {
  try {
    const [record] = await db("templateMessageSend")
      .insert({
        agentId,
        phoneNumberId,
        templateId,
        selectedChatUserId: selectedChatUserId || null,
        createdByAdminUserId,
        mapping,
        queryId: queryId || null,
        querySnapshot: querySnapshot || null,
        recipientCount: recipientCount || null,
      })
      .returning("id");

    return {
      id: typeof record === "string" ? record : record?.id || null,
      storageEnabled: true,
    };
  } catch (error) {
    if (isMissingSchemaError(error)) {
      try {
        const [record] = await db("templateMessageSend")
          .insert({
            agentId,
            phoneNumberId,
            templateId,
            selectedChatUserId: selectedChatUserId || null,
            createdByAdminUserId,
            mapping,
          })
          .returning("id");

        return {
          id: typeof record === "string" ? record : record?.id || null,
          storageEnabled: false,
        };
      } catch (fallbackError) {
        if (!isMissingSchemaError(fallbackError)) {
          throw fallbackError;
        }

        return {
          id: null,
          storageEnabled: false,
        };
      }
    }

    throw error;
  }
}

export async function sendTemplateMessage({
  chatUserId,
  templateId,
  parameterValues,
  templateMessageSendId,
}: {
  chatUserId: string;
  templateId: string;
  parameterValues: Record<string, string>;
  templateMessageSendId?: string | null;
}): Promise<ServerActionResponse> {
  const user = await db("chatUser")
    .where("chatUser.id", chatUserId)
    .select("chatUser.id", "chatUser.number", "chatUser.agentId")
    .first();

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const agent = await db("agent")
    .where("agent.id", user.agentId)
    .select("agent.phoneNumberId")
    .first();

  if (!agent?.phoneNumberId) {
    await insertTemplateSendAttempt({
      chatUserId,
      templateId,
      success: false,
      error: "Agent has no phone number",
      templateMessageSendId,
      resolvedValues: parameterValues,
    });
    return { success: false, error: "Agent has no phone number" };
  }

  const phoneNumber = await db("phoneNumber")
    .where("phoneNumber.id", agent.phoneNumberId)
    .select("phoneNumber.metaId")
    .first();

  if (!phoneNumber?.metaId) {
    await insertTemplateSendAttempt({
      chatUserId,
      templateId,
      success: false,
      error: "Phone number not found",
      templateMessageSendId,
      resolvedValues: parameterValues,
    });
    return { success: false, error: "Phone number not found" };
  }

  const metaAccessToken = await getAccessTokenForPhoneNumberMetaId(
    phoneNumber.metaId,
  );
  if (!metaAccessToken) {
    const error =
      "No access token available for this phone number. Please ensure it is linked to an app via its WABA.";

    await insertTemplateSendAttempt({
      chatUserId,
      templateId,
      success: false,
      error,
      templateMessageSendId,
      resolvedValues: parameterValues,
    });

    return {
      success: false,
      error,
    };
  }

  const template = await db("waTemplate")
    .where("waTemplate.id", templateId)
    .select("waTemplate.name", "waTemplate.data")
    .first();

  if (!template) {
    await insertTemplateSendAttempt({
      chatUserId,
      templateId,
      success: false,
      error: "Template not found",
      templateMessageSendId,
      resolvedValues: parameterValues,
    });
    return { success: false, error: "Template not found" };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: user.number,
    type: "template",
    template: {
      name: template.name,
      language: {
        code: template.data?.language || "en",
      },
      components: (() => {
        const components = buildTemplateComponents(
          template.data,
          parameterValues,
        );
        return components.length > 0 ? components : undefined;
      })(),
    },
  };

  try {
    const response = await fetch(
      `${process.env.META_GRAPH_URL}/${phoneNumber.metaId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const responseData = await response.json();

    if (!response.ok) {
      const error =
        responseData.error?.message || "Failed to send template via Meta API";

      await insertTemplateSendAttempt({
        chatUserId,
        templateId,
        success: false,
        error,
        metaResponse: responseData,
        templateMessageSendId,
        resolvedValues: parameterValues,
      });

      return {
        success: false,
        error,
      };
    }

    await insertTemplateSendAttempt({
      chatUserId,
      templateId,
      success: true,
      metaResponse: responseData,
      templateMessageSendId,
      resolvedValues: parameterValues,
    });

    return {
      success: true,
      data: { messageId: responseData.messages?.[0]?.id },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send template message";

    await insertTemplateSendAttempt({
      chatUserId,
      templateId,
      success: false,
      error: message,
      templateMessageSendId,
      resolvedValues: parameterValues,
    });

    return {
      success: false,
      error: message,
    };
  }
}
