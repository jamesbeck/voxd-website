"use server";

import { ServerActionResponse } from "@/types/types";
import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ChatUserQueryDefinition } from "@/lib/chatUserQueryDefinition";

const saCreateChatUserQuery = async ({
  agentId,
  name,
  query,
}: {
  agentId: string;
  name: string;
  query: ChatUserQueryDefinition;
}): Promise<ServerActionResponse> => {
  try {
    const accessToken = await verifyAccessToken();

    if (!(await userCanViewAgent({ agentId, accessToken }))) {
      return {
        success: false,
        error: "Agent not found",
      };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return {
        success: false,
        error: "Query name is required",
      };
    }

    const existingQuery = await db("queries")
      .where("agentId", agentId)
      .whereRaw("LOWER(name) = LOWER(?)", [trimmedName])
      .first("id");

    if (existingQuery) {
      return {
        success: false,
        error: "A query with this name already exists for this agent",
      };
    }

    const [createdQuery] = await db("queries")
      .insert({
        agentId,
        name: trimmedName,
        definitionVersion: query.version,
        query,
        createdByAdminUserId: accessToken.adminUserId,
        updatedByAdminUserId: accessToken.adminUserId,
      })
      .returning(["id", "name", "agentId", "definitionVersion", "query"]);

    return {
      success: true,
      data: createdQuery,
    };
  } catch {
    return {
      success: false,
      error: "Failed to save query",
    };
  }
};

export default saCreateChatUserQuery;
