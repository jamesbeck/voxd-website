"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { TemplateRecord } from "@/lib/templateMessages";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saGetTemplatesForAgent = async ({
  agentId,
}: {
  agentId: string;
}): Promise<{
  success: boolean;
  error?: string;
  templates?: TemplateRecord[];
}> => {
  const accessToken = await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return { success: false, error: "Unauthorized" };
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

  const templates = await db("waTemplate")
    .where("waTemplate.wabaId", phoneNumber.wabaId)
    .where("waTemplate.status", "APPROVED")
    .select(
      "waTemplate.id",
      "waTemplate.metaId",
      "waTemplate.name",
      "waTemplate.status",
      "waTemplate.category",
      "waTemplate.data",
    )
    .orderBy("waTemplate.name", "asc");

  return {
    success: true,
    templates,
  };
};

export default saGetTemplatesForAgent;
