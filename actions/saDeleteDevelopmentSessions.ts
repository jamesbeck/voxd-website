"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saDeleteDevelopmentSessions = async (): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const deleted = await db("session")
    .delete()
    .where({ sessionType: "development" });

  return { success: true, data: { count: deleted } };
};

export default saDeleteDevelopmentSessions;
