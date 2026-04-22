"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saMarkExampleConversationGenerationError = async ({
  conversationId,
  summary,
  detail,
}: {
  conversationId: string;
  summary: string;
  detail?: string;
}): Promise<ServerActionResponse> => {
  if (!conversationId) {
    return {
      success: false,
      error: "Conversation ID is required",
    };
  }

  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error:
        "Only partners and super admins can update example conversation generation errors",
    };
  }

  const conversation = await db("exampleConversation")
    .leftJoin("example", "example.id", "exampleConversation.exampleId")
    .leftJoin("quote", "exampleConversation.quoteId", "quote.id")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .where("exampleConversation.id", conversationId)
    .select(
      "exampleConversation.id",
      "example.partnerId as examplePartnerId",
      "organisation.partnerId as quotePartnerId",
    )
    .first();

  if (!conversation) {
    return {
      success: false,
      error: "Conversation not found",
    };
  }

  const ownerPartnerId =
    conversation.examplePartnerId || conversation.quotePartnerId;
  const isSuperAdmin = accessToken.superAdmin;
  const isOwnerPartner =
    accessToken.partner && accessToken.partnerId === ownerPartnerId;

  if (!isSuperAdmin && !isOwnerPartner) {
    return {
      success: false,
      error: "You don't have permission to update this conversation",
    };
  }

  await db("exampleConversation")
    .where("id", conversationId)
    .update({
      generationStatus: "error",
      generationErrorSummary: summary,
      generationErrorDetail: detail || summary,
    });

  return { success: true };
};

export default saMarkExampleConversationGenerationError;
