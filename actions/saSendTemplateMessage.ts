"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type TemplateParameter = {
  type: "text";
  text: string;
  parameter_name?: string; // For named parameters
};

type TemplateComponent = {
  type: "header" | "body" | "button";
  sub_type?: string;
  index?: number;
  parameters?: TemplateParameter[];
};

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
    // Get chatUser with phone number
    const user = await db("chatUser")
      .where("chatUser.id", userId)
      .select("chatUser.number", "chatUser.agentId")
      .first();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get agent with phone number
    const agent = await db("agent")
      .where("agent.id", user.agentId)
      .select("agent.phoneNumberId")
      .first();

    if (!agent?.phoneNumberId) {
      return { success: false, error: "Agent has no phone number" };
    }

    // Get phone number meta ID
    const phoneNumber = await db("phoneNumber")
      .where("phoneNumber.id", agent.phoneNumberId)
      .select("phoneNumber.metaId")
      .first();

    if (!phoneNumber?.metaId) {
      return { success: false, error: "Phone number not found" };
    }

    // Get template
    const template = await db("waTemplate")
      .where("waTemplate.id", templateId)
      .select("waTemplate.name", "waTemplate.data", "waTemplate.metaId")
      .first();

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const templateData = template.data;
    const isNamed = templateData?.parameter_format === "NAMED";

    // Build components array for Meta API
    const components: TemplateComponent[] = [];

    for (const comp of templateData?.components || []) {
      if (comp.type === "HEADER" && comp.format === "TEXT") {
        // Check if header has parameters
        const headerParams: TemplateParameter[] = [];

        if (isNamed && comp.example?.body_text_named_params) {
          for (const param of comp.example.body_text_named_params) {
            if (parameterValues[param.param_name]) {
              headerParams.push({
                type: "text",
                parameter_name: param.param_name,
                text: parameterValues[param.param_name],
              });
            }
          }
        } else if (comp.example?.header_text) {
          comp.example.header_text.forEach((_: string, index: number) => {
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
      } else if (comp.type === "BODY") {
        const bodyParams: TemplateParameter[] = [];

        if (isNamed && comp.example?.body_text_named_params) {
          for (const param of comp.example.body_text_named_params) {
            if (parameterValues[param.param_name]) {
              bodyParams.push({
                type: "text",
                parameter_name: param.param_name,
                text: parameterValues[param.param_name],
              });
            }
          }
        } else if (comp.example?.body_text) {
          const bodyTextParams = comp.example.body_text[0] || [];
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

    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP;
    const url = `${process.env.META_GRAPH_URL}/${phoneNumber.metaId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: user.number,
      type: "template",
      template: {
        name: template.name,
        language: {
          code: templateData?.language || "en",
        },
        components: components.length > 0 ? components : undefined,
      },
    };

    console.log("Sending template payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error response from Meta API:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send template via Meta API",
      };
    }

    // Log success
    console.log("Template message sent successfully:", data);

    return { success: true, data: { messageId: data.messages?.[0]?.id } };
  } catch (error) {
    console.error("Error sending template message:", error);
    return { success: false, error: "Failed to send template message" };
  }
};

export default saSendTemplateMessage;
