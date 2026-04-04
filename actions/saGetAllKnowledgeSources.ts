"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saGetAllKnowledgeSources = async (): Promise<ServerActionResponse> => {
  try {
    const knowledgeSources = await db("knowledgeSource")
      .select("id", "name", "description")
      .orderBy("name", "asc");

    return {
      success: true,
      data: knowledgeSources,
    };
  } catch (error) {
    console.error("Error fetching knowledge sources:", error);
    return {
      success: false,
      error: "Failed to fetch knowledge sources",
    };
  }
};

export default saGetAllKnowledgeSources;
