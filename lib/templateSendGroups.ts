import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  applyChatUserQueryDefinition,
  SavedChatUserQuery,
} from "@/lib/chatUserQueryDefinition";
import userCanViewAgent from "@/lib/userCanViewAgent";
import { TemplateChatUserRecord } from "@/lib/templateMessages";

export async function getSavedTemplateSendGroup({
  agentId,
  queryId,
}: {
  agentId: string;
  queryId: string;
}): Promise<
  | {
      success: true;
      query: SavedChatUserQuery;
    }
  | {
      success: false;
      error: string;
    }
> {
  const accessToken = await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return { success: false, error: "Unauthorized" };
  }

  const query = await db("queries")
    .where("id", queryId)
    .where("agentId", agentId)
    .first(
      "id",
      "agentId",
      "name",
      "definitionVersion",
      "query",
      "createdAt",
      "updatedAt",
    );

  if (!query) {
    return { success: false, error: "Saved group not found" };
  }

  return {
    success: true,
    query: query as SavedChatUserQuery,
  };
}

export async function getChatUsersForSavedTemplateSendGroup({
  agentId,
  queryId,
}: {
  agentId: string;
  queryId: string;
}): Promise<
  | {
      success: true;
      query: SavedChatUserQuery;
      chatUsers: TemplateChatUserRecord[];
      excludedUsersWithoutWhatsApp: number;
    }
  | {
      success: false;
      error: string;
    }
> {
  const groupResult = await getSavedTemplateSendGroup({ agentId, queryId });
  if (!groupResult.success) {
    return groupResult;
  }

  const chatUsersQuery = db("chatUser")
    .where("chatUser.agentId", agentId)
    .select(
      "chatUser.id",
      "chatUser.name",
      "chatUser.number",
      "chatUser.email",
      "chatUser.externalId",
      "chatUser.data",
    );

  const applyResult = applyChatUserQueryDefinition({
    query: chatUsersQuery,
    definition: groupResult.query.query,
  });

  if (!applyResult.success) {
    return { success: false, error: applyResult.error };
  }

  const chatUsers = await chatUsersQuery.orderBy("chatUser.name", "asc");
  const eligibleChatUsers = (chatUsers as TemplateChatUserRecord[]).filter(
    (chatUser) => !!chatUser.number?.trim(),
  );

  return {
    success: true,
    query: groupResult.query,
    chatUsers: eligibleChatUsers,
    excludedUsersWithoutWhatsApp: chatUsers.length - eligibleChatUsers.length,
  };
}
