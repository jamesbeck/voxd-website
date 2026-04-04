"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saGetAllIntegrations = async (): Promise<ServerActionResponse> => {
  try {
    const integrations = await db("integration")
      .select("id", "name", "description")
      .orderBy("name", "asc");

    return {
      success: true,
      data: integrations,
    };
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return {
      success: false,
      error: "Failed to fetch integrations",
    };
  }
};

export default saGetAllIntegrations;
