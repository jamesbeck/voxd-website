"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteQuoteExampleConversation = async ({
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

  // Get the conversation with quote and organisation data
  const conversation = await db("exampleConversation")
    .leftJoin("quote", "exampleConversation.quoteId", "quote.id")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .where("exampleConversation.id", conversationId)
    .select("exampleConversation.*", "organisation.partnerId")
    .first();

  if (!conversation) {
    return {
      success: false,
      error: "Conversation not found",
    };
  }

  // Check if user is super admin or the partner that owns this quote
  const isSuperAdmin = accessToken.superAdmin;
  const isOwnerPartner =
    accessToken.partner && accessToken.partnerId === conversation.partnerId;

  if (!isSuperAdmin && !isOwnerPartner) {
    return {
      success: false,
      error: "You don't have permission to delete this conversation",
    };
  }

  // Delete the conversation
  await db("exampleConversation").where({ id: conversationId }).delete();

  return { success: true };
};

export default saDeleteQuoteExampleConversation;
