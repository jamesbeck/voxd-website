"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";

export default async function saUpdateAgentModel({
  agentId,
  modelId,
}: {
  agentId: string;
  modelId: string;
}): Promise<ServerActionResponse> {
  try {
    const accessToken = await verifyAccessToken();

    // Get the agent with organisation info for authorization
    const agent = await db("agent")
      .leftJoin("organisation", "agent.organisationId", "organisation.id")
      .leftJoin("model", "agent.modelId", "model.id")
      .leftJoin("provider", "model.providerId", "provider.id")
      .where("agent.id", agentId)
      .select(
        "agent.organisationId",
        "organisation.partnerId",
        "agent.modelId as oldModelId",
        "model.model as oldModelName",
        "provider.name as oldProviderName"
      )
      .first();

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    // Authorization check
    const isAuthorized =
      accessToken.superAdmin ||
      (accessToken.partner && agent.partnerId === accessToken.partnerId) ||
      (!accessToken.partner &&
        agent.organisationId === accessToken.organisationId);

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the model exists and get model details
    const model = await db("model")
      .leftJoin("provider", "model.providerId", "provider.id")
      .where("model.id", modelId)
      .select("model.*", "provider.name as providerName")
      .first();

    if (!model) {
      return { success: false, error: "Model not found" };
    }

    // Update the agent's model
    await db("agent").where({ id: agentId }).update({ modelId });

    // Log the change
    await addLog({
      adminUserId: accessToken.adminUserId,
      agentId: agentId,
      event: "Agent Model Changed",
      description: `Changed agent model from ${
        agent?.oldProviderName || "Unknown"
      } / ${agent?.oldModelName || "Unknown"} to ${
        model.providerName || "Unknown"
      } / ${model.model}`,
      data: {
        oldModelId: agent?.oldModelId,
        oldModelName: agent?.oldModelName,
        oldProviderName: agent?.oldProviderName,
        newModelId: modelId,
        newModelName: model.model,
        newProviderName: model.providerName,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating agent model:", error);
    return { success: false, error: "Failed to update agent model" };
  }
}
