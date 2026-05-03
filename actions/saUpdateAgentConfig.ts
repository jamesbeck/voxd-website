"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";
import { validateAgentConfig } from "@/lib/validateAgentConfig";
import { buildJsonDelta } from "@/lib/buildJsonDelta";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { hasAdminUserPermission } from "@/lib/adminUserPermissions";

const saUpdateAgentConfig = async ({
  agentId,
  config,
}: {
  agentId: string;
  config: any;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!agentId) {
    return {
      success: false,
      error: "Agent ID is required",
    };
  }

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  const canReadAgentConfig =
    !!accessToken.superAdmin ||
    (await hasAdminUserPermission({
      adminUserId: accessToken.adminUserId,
      permissionKey: "read_agent_config",
      agentId,
    }));

  const canWriteAgentConfig =
    canReadAgentConfig &&
    (!!accessToken.superAdmin ||
      (await hasAdminUserPermission({
        adminUserId: accessToken.adminUserId,
        permissionKey: "write_agent_config",
        agentId,
      })));

  if (!canWriteAgentConfig) {
    return {
      success: false,
      error: "You do not have permission to update agent config.",
    };
  }

  // Find the existing agent
  const existingAgent = await db("agent")
    .select("*")
    .where({ id: agentId })
    .first();

  if (!existingAgent) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  const validationResult = validateAgentConfig({
    schema: existingAgent.configSchema,
    config,
  });

  if (!validationResult.valid) {
    return {
      success: false,
      error: validationResult.error,
      fieldErrors: validationResult.fieldErrors,
    };
  }

  // Update the agent config
  await db("agent").where({ id: agentId }).update({
    config,
  });

  const previousConfig = existingAgent.config ?? null;
  const nextConfig = config ?? null;

  // Log the action
  await addLog({
    event: "Agent Config Updated",
    description: `Updated config for agent ${existingAgent.niceName}`,
    adminUserId: accessToken.adminUserId,
    agentId,
    data: {
      before: previousConfig,
      after: nextConfig,
      delta: buildJsonDelta(previousConfig, nextConfig),
    },
  });

  return { success: true };
};

export { saUpdateAgentConfig };
