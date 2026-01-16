"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

type ExampleConversationData = {
  id: string;
  description: string;
  startTime: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    time: number;
    annotation: string | null;
  }[];
  exampleId: string | null;
  quoteId: string | null;
  // If from example
  businessName?: string;
  logoFileExtension?: string | null;
  // If from quote/organization
  organizationId?: string | null;
  organizationName?: string;
  organizationLogoFileExtension?: string | null;
  organizationLogoDarkBackground?: boolean;
};

const saGetExampleConversationById = async ({
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

  // Fetch the conversation with related data
  const conversation = await db("exampleConversation")
    .leftJoin("example", "example.id", "exampleConversation.exampleId")
    .leftJoin("quote", "quote.id", "exampleConversation.quoteId")
    .leftJoin("organisation", "organisation.id", "quote.organisationId")
    .where("exampleConversation.id", conversationId)
    .select(
      "exampleConversation.id",
      "exampleConversation.description",
      "exampleConversation.startTime",
      "exampleConversation.messages",
      "exampleConversation.exampleId",
      "exampleConversation.quoteId",
      // Example fields
      "example.businessName",
      "example.logoFileExtension",
      // Organization fields (from quote)
      "organisation.id as organizationId",
      "organisation.name as organizationName",
      "organisation.logoFileExtension as organizationLogoFileExtension",
      "organisation.logoDarkBackground as organizationLogoDarkBackground"
    )
    .first();

  if (!conversation) {
    return {
      success: false,
      error: "Conversation not found",
    };
  }

  return {
    success: true,
    data: conversation,
  };
};

export default saGetExampleConversationById;
