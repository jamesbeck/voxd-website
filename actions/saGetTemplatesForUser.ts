"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type TemplateForUser = {
  id: string;
  metaId: string;
  name: string;
  status: string;
  category: string;
  data: {
    language: string;
    components: {
      type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
      format?: string;
      text?: string;
      example?: {
        header_text?: string[];
        body_text?: string[][];
        body_text_named_params?: { param_name: string; example: string }[];
      };
      buttons?: {
        type: string;
        text: string;
        url?: string;
        phone_number?: string;
      }[];
    }[];
    parameter_format?: "NAMED" | "POSITIONAL";
    sub_category?: string;
  };
};

const saGetTemplatesForUser = async ({
  userId,
}: {
  userId: string;
}): Promise<{
  success: boolean;
  error?: string;
  templates?: TemplateForUser[];
  phoneNumberId?: string;
}> => {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.admin) {
    return { success: false, error: "Unauthorized" };
  }

  // Get user with agent and phone number chain
  const user = await db("user")
    .where("user.id", userId)
    .select("user.agentId")
    .first();

  if (!user?.agentId) {
    return { success: false, error: "User has no agent" };
  }

  const agent = await db("agent")
    .where("agent.id", user.agentId)
    .select("agent.phoneNumberId")
    .first();

  if (!agent?.phoneNumberId) {
    return { success: false, error: "Agent has no phone number" };
  }

  const phoneNumber = await db("phoneNumber")
    .where("phoneNumber.id", agent.phoneNumberId)
    .select("phoneNumber.wabaId", "phoneNumber.metaId")
    .first();

  if (!phoneNumber?.wabaId) {
    return { success: false, error: "Phone number has no WABA" };
  }

  // Get templates for this WABA that are approved
  const templates = await db("waTemplate")
    .where("waTemplate.wabaId", phoneNumber.wabaId)
    .where("waTemplate.status", "APPROVED")
    .select(
      "waTemplate.id",
      "waTemplate.metaId",
      "waTemplate.name",
      "waTemplate.status",
      "waTemplate.category",
      "waTemplate.data"
    )
    .orderBy("waTemplate.name", "asc");

  return {
    success: true,
    templates,
    phoneNumberId: phoneNumber.metaId,
  };
};

export default saGetTemplatesForUser;
