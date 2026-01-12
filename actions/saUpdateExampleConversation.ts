"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type Message = {
  role: "user" | "assistant";
  content: string;
  annotation: string | null;
  time: number;
};

const saUpdateExampleConversation = async ({
  conversationId,
  messages,
  description,
  startTime,
}: {
  conversationId: string;
  messages: Message[];
  description?: string;
  startTime?: string;
}): Promise<ServerActionResponse> => {
  if (!conversationId) {
    return {
      success: false,
      error: "Conversation ID is required",
    };
  }

  if (!messages || messages.length === 0) {
    return {
      success: false,
      error: "Messages are required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Only partners and super admins can update conversations
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "Only partners and super admins can edit example conversations",
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

  // Partners can only update conversations from their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (conversation.partnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You can only edit conversations from your own examples",
      };
    }
  }

  // Update the conversation
  const updateData: Record<string, unknown> = {
    messages: JSON.stringify(messages),
  };

  if (description !== undefined) {
    updateData.description = description;
  }

  if (startTime !== undefined) {
    updateData.startTime = startTime;
  }

  await db("exampleConversation")
    .where({ id: conversationId })
    .update(updateData);

  return { success: true };
};

export default saUpdateExampleConversation;
