"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";
import userCanViewAgent from "@/lib/userCanViewAgent";

export default async function saUpdateAgentModel({
  agentId,
  modelId,
  providerApiKeyId,
}: {
  agentId: string;
  modelId: string;
  providerApiKeyId: string;
}): Promise<ServerActionResponse> {
  try {
    const accessToken = await verifyAccessToken();

    if (!agentId || !modelId || !providerApiKeyId) {
      return {
        success: false,
        error: "Agent, model, and provider API key are required.",
      };
    }

    if (!(await userCanViewAgent({ agentId, accessToken }))) {
      return { success: false, error: "Agent not found" };
    }

    const agent = await db("agent")
      .leftJoin("model", "agent.modelId", "model.id")
      .leftJoin("provider", "model.providerId", "provider.id")
      .leftJoin("providerApiKey", "agent.providerApiKeyId", "providerApiKey.id")
      .leftJoin(
        "provider as oldKeyProvider",
        "providerApiKey.providerId",
        "oldKeyProvider.id",
      )
      .where("agent.id", agentId)
      .select(
        "agent.organisationId",
        "agent.modelId as oldModelId",
        "agent.providerApiKeyId as oldProviderApiKeyId",
        "model.model as oldModelName",
        "provider.name as oldProviderName",
        "oldKeyProvider.name as oldKeyProviderName",
      )
      .first();

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const model = await db("model")
      .leftJoin("provider", "model.providerId", "provider.id")
      .where("model.id", modelId)
      .where("model.disabled", false)
      .select(
        "model.id",
        "model.model",
        "model.providerId",
        "provider.name as providerName",
      )
      .first();

    if (!model) {
      return { success: false, error: "Model not found" };
    }

    const providerApiKey = await db("providerApiKey")
      .leftJoin("provider", "providerApiKey.providerId", "provider.id")
      .where("providerApiKey.id", providerApiKeyId)
      .where("providerApiKey.organisationId", agent.organisationId)
      .select(
        "providerApiKey.id",
        "providerApiKey.providerId",
        "provider.name as providerName",
      )
      .first();

    if (!providerApiKey) {
      return {
        success: false,
        error: "Provider API key not found for this organisation.",
      };
    }

    if (providerApiKey.providerId !== model.providerId) {
      return {
        success: false,
        error:
          "The selected model is not compatible with the selected API key.",
      };
    }

    await db("agent").where({ id: agentId }).update({
      modelId,
      providerApiKeyId,
    });

    await addLog({
      adminUserId: accessToken.adminUserId,
      agentId: agentId,
      event: "Agent Model Settings Changed",
      description: `Changed agent model from ${
        agent?.oldProviderName || "Unknown"
      } / ${agent?.oldModelName || "Unknown"} (${agent?.oldKeyProviderName || "Unknown"} key) to ${
        model.providerName || "Unknown"
      } / ${model.model} (${providerApiKey.providerName || "Unknown"} key)`,
      data: {
        oldModelId: agent?.oldModelId,
        oldModelName: agent?.oldModelName,
        oldProviderName: agent?.oldProviderName,
        oldProviderApiKeyId: agent?.oldProviderApiKeyId,
        oldKeyProviderName: agent?.oldKeyProviderName,
        newModelId: modelId,
        newModelName: model.model,
        newProviderName: model.providerName,
        newProviderApiKeyId: providerApiKeyId,
        newKeyProviderName: providerApiKey.providerName,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating agent model:", error);
    return { success: false, error: "Failed to update agent model" };
  }
}
