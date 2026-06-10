"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";
import userCanViewAgent from "@/lib/userCanViewAgent";

export default async function saUpdateAgentModel({
  agentId,
  modelId,
  embeddingModelId,
  providerApiKeyId,
}: {
  agentId: string;
  modelId: string;
  embeddingModelId: string;
  providerApiKeyId: string;
}): Promise<ServerActionResponse> {
  try {
    const accessToken = await verifyAccessToken();

    if (!agentId || !modelId || !embeddingModelId || !providerApiKeyId) {
      return {
        success: false,
        error:
          "Agent, chat model, embedding model, and provider API key are required.",
      };
    }

    if (!(await userCanViewAgent({ agentId, accessToken }))) {
      return { success: false, error: "Agent not found" };
    }

    const agent = await db("agent")
      .leftJoin("model as chatModel", "agent.modelId", "chatModel.id")
      .leftJoin(
        "provider as chatProvider",
        "chatModel.providerId",
        "chatProvider.id",
      )
      .leftJoin(
        "model as embeddingModel",
        "agent.embeddingModelId",
        "embeddingModel.id",
      )
      .leftJoin(
        "provider as embeddingProvider",
        "embeddingModel.providerId",
        "embeddingProvider.id",
      )
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
        "agent.embeddingModelId as oldEmbeddingModelId",
        "agent.providerApiKeyId as oldProviderApiKeyId",
        "chatModel.model as oldModelName",
        "chatProvider.name as oldProviderName",
        "embeddingModel.model as oldEmbeddingModelName",
        "embeddingProvider.name as oldEmbeddingProviderName",
        "oldKeyProvider.name as oldKeyProviderName",
      )
      .first();

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const selectedModels = await db("model")
      .leftJoin("provider", "model.providerId", "provider.id")
      .whereIn("model.id", [modelId, embeddingModelId])
      .where("model.disabled", false)
      .select(
        "model.id",
        "model.model",
        "model.providerId",
        "model.embeddings",
        "provider.name as providerName",
      );

    const model = selectedModels.find((record) => record.id === modelId);
    const embeddingModel = selectedModels.find(
      (record) => record.id === embeddingModelId,
    );

    if (!model) {
      return { success: false, error: "Model not found" };
    }

    if (!embeddingModel) {
      return { success: false, error: "Embedding model not found" };
    }

    if (!embeddingModel.embeddings) {
      return {
        success: false,
        error: "The selected embedding model does not support embeddings.",
      };
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

    if (
      providerApiKey.providerId !== model.providerId ||
      providerApiKey.providerId !== embeddingModel.providerId
    ) {
      return {
        success: false,
        error:
          "The selected models are not compatible with the selected API key.",
      };
    }

    await db("agent").where({ id: agentId }).update({
      modelId,
      embeddingModelId,
      providerApiKeyId,
    });

    await addLog({
      adminUserId: accessToken.adminUserId,
      agentId: agentId,
      event: "Agent Model Settings Changed",
      description: `Changed agent model from ${
        agent?.oldProviderName || "Unknown"
      } / ${agent?.oldModelName || "Unknown"} and embedding model from ${
        agent?.oldEmbeddingProviderName || "Unknown"
      } / ${agent?.oldEmbeddingModelName || "Unknown"} (${agent?.oldKeyProviderName || "Unknown"} key) to ${
        model.providerName || "Unknown"
      } / ${model.model} and ${embeddingModel.providerName || "Unknown"} / ${
        embeddingModel.model
      } (${providerApiKey.providerName || "Unknown"} key)`,
      data: {
        oldModelId: agent?.oldModelId,
        oldModelName: agent?.oldModelName,
        oldProviderName: agent?.oldProviderName,
        oldEmbeddingModelId: agent?.oldEmbeddingModelId,
        oldEmbeddingModelName: agent?.oldEmbeddingModelName,
        oldEmbeddingProviderName: agent?.oldEmbeddingProviderName,
        oldProviderApiKeyId: agent?.oldProviderApiKeyId,
        oldKeyProviderName: agent?.oldKeyProviderName,
        newModelId: modelId,
        newModelName: model.model,
        newProviderName: model.providerName,
        newEmbeddingModelId: embeddingModelId,
        newEmbeddingModelName: embeddingModel.model,
        newEmbeddingProviderName: embeddingModel.providerName,
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
