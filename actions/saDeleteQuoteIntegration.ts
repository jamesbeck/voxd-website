"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saDeleteQuoteIntegration = async ({
  id,
}: {
  id: string;
}): Promise<ServerActionResponse> => {
  if (!id) {
    return { success: false, error: "ID is required" };
  }

  try {
    await db("quoteIntegration").where({ id }).delete();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to delete integration",
    };
  }
};

export default saDeleteQuoteIntegration;
