"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreateKnowledgeSource = async ({
  name,
  description,
  setupHours,
}: {
  name: string;
  description?: string;
  setupHours?: number;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const newRecord = await db("knowledgeSource")
    .insert({ name, description, setupHours })
    .returning("*");

  return { success: true, data: newRecord };
};

export default saCreateKnowledgeSource;
