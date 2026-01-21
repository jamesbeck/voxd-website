"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import generateConversation from "@/lib/generateConversation";

const saGenerateQuoteExampleConversation = async ({
  quoteId,
  prompt,
}: {
  quoteId: string;
  prompt: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  if (!prompt) {
    return {
      success: false,
      error: "Prompt is required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Get the quote with organisation and partner data
  const quote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .where("quote.id", quoteId)
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "organisation.partnerId",
      "partner.openAiApiKey",
    )
    .first();

  if (!quote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Check if user is super admin or the partner that owns this quote
  const isSuperAdmin = accessToken.superAdmin;
  const isOwnerPartner =
    accessToken.partner && accessToken.partnerId === quote.partnerId;

  if (!isSuperAdmin && !isOwnerPartner) {
    return {
      success: false,
      error:
        "You don't have permission to generate conversations for this quote",
    };
  }

  // Check if partner has an OpenAI API key
  if (!quote.openAiApiKey) {
    return {
      success: false,
      error: "Partner does not have an OpenAI API key configured",
    };
  }

  // Build the specification context from the fields
  const specificationContext = `
Background:
${quote.background || "Not specified"}

Objectives:
${quote.objectives || "Not specified"}

Data Sources & Integrations:
${quote.dataSourcesAndIntegrations || "Not specified"}

Other Notes:
${quote.otherNotes || "Not specified"}
  `.trim();

  // Use the shared conversation generation function
  return generateConversation({
    prompt,
    openAiApiKey: quote.openAiApiKey,
    context: specificationContext,
    businessName: quote.organisationName || "the organisation",
    quoteId,
  });
};

export default saGenerateQuoteExampleConversation;
