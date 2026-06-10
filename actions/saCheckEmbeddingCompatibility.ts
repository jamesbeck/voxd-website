"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saCheckEmbeddingCompatibility = async ({
  agentId,
  documentId,
}: {
  agentId: string;
  documentId?: string;
}): Promise<{
  success: boolean;
  data?: { incompatibleCount: number; currentModel: string | null };
  error?: string;
}> => {
  await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId }))) {
    return { success: false, error: "Unauthorized" };
  }

  const agent = await db("agent")
    .leftJoin(
      "model as embeddingModel",
      "agent.embeddingModelId",
      "embeddingModel.id",
    )
    .where("agent.id", agentId)
    .select("embeddingModel.model as embeddingModelName")
    .first();

  if (!agent?.embeddingModelName) {
    return {
      success: true,
      data: { incompatibleCount: 0, currentModel: null },
    };
  }

  const currentModel = agent.embeddingModelName;

  const query = db("knowledgeBlock")
    .join(
      "knowledgeDocument",
      "knowledgeBlock.documentId",
      "knowledgeDocument.id",
    )
    .whereNotNull("knowledgeBlock.embedding")
    .where(function () {
      this.where(
        "knowledgeBlock.embeddingModel",
        "!=",
        currentModel!,
      ).orWhereNull("knowledgeBlock.embeddingModel");
    });

  if (documentId) {
    query.where("knowledgeBlock.documentId", documentId);
  } else {
    query.where("knowledgeDocument.agentId", agentId);
  }

  const [{ count }] = await query.count("knowledgeBlock.id as count");

  return {
    success: true,
    data: { incompatibleCount: Number(count), currentModel },
  };
};

export default saCheckEmbeddingCompatibility;
