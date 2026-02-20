"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export type PollConversationResult = {
  id: string;
  generating: boolean;
  description?: string;
  prompt?: string;
  startTime?: string;
  messages?: {
    role: "user" | "assistant";
    content: string;
    annotation: string | null;
    time: number;
    imageUrl?: string;
    fileName?: string;
    fileSize?: string;
  }[];
};

const saPollExampleConversations = async (input: {
  conversationIds: string[];
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();
  if (!accessToken.superAdmin && !accessToken.partner) {
    return { success: false, error: "Permission denied" };
  }

  if (!input.conversationIds || input.conversationIds.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const conversations = await db("exampleConversation")
      .whereIn("id", input.conversationIds)
      .select(
        "id",
        "generating",
        "description",
        "prompt",
        "startTime",
        "messages",
      );

    const results: PollConversationResult[] = conversations.map((conv: any) => {
      if (conv.generating) {
        // Still generating — return minimal data
        return { id: conv.id, generating: true };
      }

      // Complete — return full conversation data
      const messages =
        typeof conv.messages === "string"
          ? JSON.parse(conv.messages)
          : conv.messages || [];

      return {
        id: conv.id,
        generating: false,
        description: conv.description,
        prompt: conv.prompt,
        startTime: conv.startTime,
        messages,
      };
    });

    return { success: true, data: results };
  } catch (error: any) {
    console.error("Error polling example conversations:", error);
    return {
      success: false,
      error: error?.message || "Failed to poll conversations",
    };
  }
};

export default saPollExampleConversations;
