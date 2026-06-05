"use server";

import { z } from "zod";
import db from "@/database/db";
import { addLog } from "@/lib/addLog";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ServerActionResponse } from "@/types/types";

const billingSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  voxdMonthlyFee: z.number().int().min(0).nullable().optional(),
  retailMonthlyFee: z.number().int().min(0).nullable().optional(),
  billingStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid billing date")
    .nullable()
    .optional(),
});

const saUpdateAgentBilling = async ({
  agentId,
  voxdMonthlyFee,
  retailMonthlyFee,
  billingStartDate,
}: {
  agentId: string;
  voxdMonthlyFee?: number | null;
  retailMonthlyFee?: number | null;
  billingStartDate?: string | null;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  const validation = billingSchema.safeParse({
    agentId,
    voxdMonthlyFee,
    retailMonthlyFee,
    billingStartDate,
  });

  if (!validation.success) {
    return {
      success: false,
      error: "Invalid billing details",
      fieldErrors: Object.fromEntries(
        validation.error.issues.map((issue) => [
          String(issue.path[0] ?? "root"),
          issue.message,
        ]),
      ),
    };
  }

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to update agent billing.",
    };
  }

  const existingAgent = await db("agent")
    .select(
      "id",
      "niceName",
      "organisationId",
      "voxdMonthlyFee",
      "retailMonthlyFee",
      "billingStartDate",
    )
    .where({ id: agentId })
    .first();

  if (!existingAgent) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  const updateData = {
    voxdMonthlyFee: voxdMonthlyFee ?? null,
    retailMonthlyFee: retailMonthlyFee ?? null,
    billingStartDate: billingStartDate ?? null,
  };

  await db("agent").where({ id: agentId }).update(updateData);

  await addLog({
    adminUserId: accessToken.adminUserId,
    organisationId: existingAgent.organisationId ?? undefined,
    agentId,
    event: "AGENT_BILLING_UPDATED",
    description: `Updated billing for agent ${existingAgent.niceName}`,
    data: {
      before: {
        voxdMonthlyFee: existingAgent.voxdMonthlyFee,
        retailMonthlyFee: existingAgent.retailMonthlyFee,
        billingStartDate: existingAgent.billingStartDate,
      },
      after: updateData,
    },
  });

  return { success: true };
};

export default saUpdateAgentBilling;
