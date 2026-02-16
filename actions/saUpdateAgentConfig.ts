"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";

const saUpdateAgentConfig = async ({
  agentId,
  config,
}: {
  agentId: string;
  config: any;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin)
    return {
      success: false,
      error: "You do not have permission to update agent config.",
    };

  if (!agentId) {
    return {
      success: false,
      error: "Agent ID is required",
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

  // Update the agent config
  await db("agent").where({ id: agentId }).update({
    config,
  });

  // Log the action
  await addLog({
    event: "agent.update_config",
    description: `Updated config for agent ${existingAgent.niceName}`,
    adminUserId: accessToken.adminUserId,
    agentId,
  });

  return { success: true };
};

export { saUpdateAgentConfig };
