"use server";

import { ServerActionResponse } from "@/types/types";
import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saDeleteChatUserQuery = async ({
  queryId,
}: {
  queryId: string;
}): Promise<ServerActionResponse> => {
  try {
    const accessToken = await verifyAccessToken();

    const existingQuery = await db("queries")
      .where("id", queryId)
      .first("id", "agentId");

    if (!existingQuery) {
      return {
        success: false,
        error: "Query not found",
      };
    }

    if (
      !(await userCanViewAgent({
        agentId: existingQuery.agentId,
        accessToken,
      }))
    ) {
      return {
        success: false,
        error: "Query not found",
      };
    }

    await db("queries").where("id", queryId).delete();

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: "Failed to delete query",
    };
  }
};

export default saDeleteChatUserQuery;
