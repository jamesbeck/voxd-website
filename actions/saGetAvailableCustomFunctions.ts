"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { getScopedAgentForAdminUser } from "@/lib/adminUserPermissions";
import { ServerActionResponse } from "@/types/types";

type CustomFunctionRecord = {
  id: string;
  agentId: string;
  key: string;
  name: string;
  displayName: string | null;
  niceName: string;
  description: string;
  humanReadableDescription: string;
  targetScopes: string[];
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  enabled: boolean;
  allowManualRun: boolean;
  allowApiRun: boolean;
  supportsScheduling: boolean;
  nextScheduledRunAt: Date | null;
  uiOrder: number | null;
  notes: string | null;
  updatedAt: Date;
};

const saGetAvailableCustomFunctions = async ({
  agentId,
}: {
  agentId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  const scopedAgent = await getScopedAgentForAdminUser({
    agentId,
    targetAdminUser: {
      superAdmin: accessToken.superAdmin,
      isPartnerUser: accessToken.partner,
      partnerId: accessToken.partnerId,
      organisationId: accessToken.organisationId,
    },
  });

  if (!scopedAgent) {
    return {
      success: false,
      error: "Unauthorized: You do not have access to this agent",
    };
  }

  const functions = await db("customFunction")
    .select<
      CustomFunctionRecord[]
    >("customFunction.id", "customFunction.agentId", "customFunction.key", "customFunction.name", "customFunction.displayName", "customFunction.niceName", "customFunction.description", "customFunction.humanReadableDescription", "customFunction.targetScopes", "customFunction.inputSchema", "customFunction.outputSchema", "customFunction.enabled", "customFunction.allowManualRun", "customFunction.allowApiRun", "customFunction.supportsScheduling", "customFunction.nextScheduledRunAt", "customFunction.uiOrder", "customFunction.notes", "customFunction.updatedAt")
    .where("customFunction.agentId", agentId)
    .whereNull("customFunction.archivedAt")
    .where("customFunction.enabled", true)
    .where("customFunction.allowManualRun", true)
    .where("customFunction.allowApiRun", true)
    .orderByRaw(
      'COALESCE("customFunction"."uiOrder", 999999) asc, COALESCE("customFunction"."displayName", "customFunction"."niceName", "customFunction"."name") asc, "customFunction"."key" asc',
    );

  return {
    success: true,
    data: functions,
  };
};

export default saGetAvailableCustomFunctions;
