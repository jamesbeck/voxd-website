"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saDeleteQuoteAction = async ({
  actionId,
}: {
  actionId: string;
}): Promise<ServerActionResponse> => {
  if (!actionId) {
    return {
      success: false,
      error: "Action ID is required",
    };
  }

  try {
    await db("quoteAction").where({ id: actionId }).delete();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to delete action",
    };
  }
};

export default saDeleteQuoteAction;
