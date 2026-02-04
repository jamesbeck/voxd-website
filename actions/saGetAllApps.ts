"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export interface App {
  id: string;
  name: string;
  metaAppId: string;
}

const saGetAllApps = async (): Promise<ServerActionResponse> => {
  try {
    const accessToken = await verifyAccessToken();

    // Only super admins can access apps
    if (!accessToken.superAdmin) {
      return {
        success: false,
        error: "Unauthorized: Only super admins can access apps",
      };
    }

    const apps: App[] = await db("metaApp")
      .select("id", "name", "metaAppId")
      .orderBy("name", "asc");

    return {
      success: true,
      data: apps,
    };
  } catch (error) {
    console.error("Error fetching apps:", error);
    return {
      success: false,
      error: "Failed to fetch apps",
    };
  }
};

export default saGetAllApps;
