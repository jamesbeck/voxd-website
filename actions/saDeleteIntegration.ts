"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteIntegration = async ({
  id,
}: {
  id: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await db("integration").where("id", id).first();

  if (!existing) {
    return { success: false, error: "Integration not found." };
  }

  await db("integration").where("id", id).delete();

  return { success: true };
};

export default saDeleteIntegration;
