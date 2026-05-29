"use server";

import { ServerActionResponse } from "@/types/types";
import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ChatUserQueryDefinition } from "@/lib/chatUserQueryDefinition";

const saUpdateChatUserQuery = async ({
  queryId,
  name,
  query,
}: {
  queryId: string;
  name: string;
  query: ChatUserQueryDefinition;
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

    const trimmedName = name.trim();
    if (!trimmedName) {
      return {
        success: false,
        error: "Query name is required",
      };
    }

    const nameConflict = await db("queries")
      .where("agentId", existingQuery.agentId)
      .whereNot("id", queryId)
      .whereRaw("LOWER(name) = LOWER(?)", [trimmedName])
      .first("id");

    if (nameConflict) {
      return {
        success: false,
        error: "A query with this name already exists for this agent",
      };
    }

    const [updatedQuery] = await db("queries")
      .where("id", queryId)
      .update({
        name: trimmedName,
        definitionVersion: query.version,
        query,
        updatedAt: db.fn.now(),
        updatedByAdminUserId: accessToken.adminUserId,
      })
      .returning(["id", "name", "agentId", "definitionVersion", "query"]);

    return {
      success: true,
      data: updatedQuery,
    };
  } catch {
    return {
      success: false,
      error: "Failed to update query",
    };
  }
};

export default saUpdateChatUserQuery;
