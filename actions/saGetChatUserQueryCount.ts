"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  applyChatUserQueryDefinition,
  ChatUserQueryDefinition,
} from "@/lib/chatUserQueryDefinition";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { ServerActionResponse } from "@/types/types";

const saGetChatUserQueryCount = async ({
  agentId,
  queryDefinition,
}: {
  agentId: string;
  queryDefinition: ChatUserQueryDefinition;
}): Promise<ServerActionResponse> => {
  try {
    const accessToken = await verifyAccessToken();

    if (!(await userCanViewAgent({ agentId, accessToken }))) {
      return {
        success: false,
        error: "Agent not found",
      };
    }

    const base = db("chatUser")
      .where("chatUser.agentId", agentId)
      .select("chatUser.id as chatUserId");

    const queryResult = applyChatUserQueryDefinition({
      query: base,
      definition: queryDefinition,
    });

    if (!queryResult.success) {
      return {
        success: false,
        error: queryResult.error,
      };
    }

    const countResult = await db
      .count<{ count: string }>("chatUserId")
      .from(base.clone().clearOrder().as("chatUserQueryCount"))
      .first();

    return {
      success: true,
      data: {
        count: Number(countResult?.count ?? 0),
      },
    };
  } catch {
    return {
      success: false,
      error: "Failed to load chat user count",
    };
  }
};

export default saGetChatUserQueryCount;