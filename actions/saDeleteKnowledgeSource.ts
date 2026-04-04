"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteKnowledgeSource = async ({
  id,
}: {
  id: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await db("knowledgeSource").where("id", id).first();

  if (!existing) {
    return { success: false, error: "Knowledge source not found." };
  }

  await db("knowledgeSource").where("id", id).delete();

  return { success: true };
};

export default saDeleteKnowledgeSource;
