"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import generateConversation from "@/lib/generateConversation";

const saGenerateExampleConversation = async ({
  exampleId,
  prompt,
}: {
  exampleId: string;
  prompt: string;
}): Promise<ServerActionResponse> => {
  if (!exampleId) {
    return {
      success: false,
      error: "Example ID is required",
    };
  }

  if (!prompt) {
    return {
      success: false,
      error: "Prompt is required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Only partners and super admins can generate conversations
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error:
        "Only partners and super admins can generate example conversations",
    };
  }

  // Get the example
  const example = await db("example").where("id", exampleId).first();

  if (!example) {
    return {
      success: false,
      error: "Example not found",
    };
  }

  // Partners can only generate conversations for their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (example.partnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You can only generate conversations for your own examples",
      };
    }
  }

  // Get the partner's OpenAI API key
  let openAiApiKey: string | null = null;

  if (accessToken.partnerId) {
    const partner = await db("partner")
      .where("id", accessToken.partnerId)
      .select("openAiApiKey")
      .first();
    openAiApiKey = partner?.openAiApiKey || null;
  }

  if (!openAiApiKey) {
    return {
      success: false,
      error:
        "Your partner account does not have an OpenAI API key configured. Please contact an administrator.",
    };
  }

  // Use the shared conversation generation function
  return generateConversation({
    prompt,
    openAiApiKey,
    context: example.body || "No specification provided",
    businessName: example.businessName || "the business",
    exampleId,
  });
};

export default saGenerateExampleConversation;
