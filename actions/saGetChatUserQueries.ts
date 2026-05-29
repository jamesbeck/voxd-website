"use server";

import { ServerActionResponse } from "@/types/types";
import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saGetChatUserQueries = async ({
  agentId,
}: {
  agentId: string;
}): Promise<ServerActionResponse> => {
  try {
    const accessToken = await verifyAccessToken();

    if (!(await userCanViewAgent({ agentId, accessToken }))) {
      return {
        success: false,
        error: "Agent not found",
      };
    }

    const queries = await db("queries")
      .where("agentId", agentId)
      .select(
        "id",
        "agentId",
        "name",
        "definitionVersion",
        "query",
        "createdAt",
        "updatedAt",
      )
      .orderBy("name", "asc");

    return {
      success: true,
      data: queries,
    };
  } catch {
    return {
      success: false,
      error: "Failed to load saved queries",
    };
  }
};

export default saGetChatUserQueries;
