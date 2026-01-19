"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteFeature = async ({
  id,
}: {
  id: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can delete features
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to delete features.",
    };
  }

  const existingFeature = await db("feature").where("id", id).first();

  if (!existingFeature) {
    return {
      success: false,
      error: "Feature not found.",
    };
  }

  await db("feature").where("id", id).delete();

  return { success: true };
};

export default saDeleteFeature;
