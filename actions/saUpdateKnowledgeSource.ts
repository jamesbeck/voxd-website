"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateKnowledgeSource = async ({
  id,
  name,
  description,
  setupHours,
}: {
  id: string;
  name: string;
  description?: string;
  setupHours?: number | null;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await db("knowledgeSource").where("id", id).first();

  if (!existing) {
    return { success: false, error: "Knowledge source not found." };
  }

  await db("knowledgeSource").where("id", id).update({
    name,
    description,
    setupHours,
  });

  return { success: true };
};

export default saUpdateKnowledgeSource;
