"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreateDocument = async ({
  agentId,
  title,
  description,
  sourceUrl,
  sourceType,
}: {
  agentId: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceType?: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  // Check the agent exists
  const agent = await db("agent").where("id", agentId).first();
  if (!agent) {
    return {
      success: false,
      error: "Agent not found",
    };
  }

  // Create the document
  const [newDocument] = await db("knowledgeDocument")
    .insert({
      agentId,
      title,
      description,
      sourceUrl,
      sourceType,
      enabled: true,
    })
    .returning("*");

  return {
    success: true,
    data: newDocument,
  };
};

export { saCreateDocument };
