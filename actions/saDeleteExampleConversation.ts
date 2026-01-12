"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteExampleConversation = async ({
  conversationId,
}: {
  conversationId: string;
}): Promise<ServerActionResponse> => {
  if (!conversationId) {
    return {
      success: false,
      error: "Conversation ID is required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Only partners and super admins can delete conversations
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "Only partners and super admins can delete example conversations",
    };
  }

  // Get the conversation with its parent example to verify ownership
  const conversation = await db("exampleConversation")
    .leftJoin("example", "example.id", "exampleConversation.exampleId")
    .where("exampleConversation.id", conversationId)
    .whereNotNull("exampleConversation.exampleId")
    .select("exampleConversation.*", "example.partnerId")
    .first();

  if (!conversation) {
    return {
      success: false,
      error: "Conversation not found",
    };
  }

  // Partners can only delete conversations from their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (conversation.partnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You can only delete conversations from your own examples",
      };
    }
  }

  // Delete the conversation
  await db("exampleConversation").where({ id: conversationId }).delete();

  return { success: true };
};

export default saDeleteExampleConversation;
