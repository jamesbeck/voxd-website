"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

interface Model {
  id: string;
  provider: string;
  model: string;
  inputTokenCost: string;
  outputTokenCost: string;
}

const saGetAllModels = async (): Promise<ServerActionResponse> => {
  try {
    const models: Model[] = await db("model")
      .select("*")
      .orderBy("provider", "asc")
      .orderBy("model", "asc");

    return {
      success: true,
      data: models,
    };
  } catch (error) {
    console.error("Error fetching models:", error);
    return {
      success: false,
      error: "Failed to fetch models",
    };
  }
};

export default saGetAllModels;
