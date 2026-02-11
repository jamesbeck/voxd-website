"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type GenerateScenarioParams =
  | {
      exampleId: string;
      quoteId?: never;
    }
  | {
      quoteId: string;
      exampleId?: never;
    };

const saGenerateScenario = async (
  params: GenerateScenarioParams,
): Promise<ServerActionResponse> => {
  const { exampleId, quoteId } = params;

  if (!exampleId && !quoteId) {
    return {
      success: false,
      error: "Either exampleId or quoteId must be provided",
    };
  }

  const accessToken = await verifyAccessToken();

  // Only partners and super admins can generate scenarios
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "Only partners and super admins can generate scenarios",
    };
  }

  let context: string = "";
  let businessName: string = "";
  let openAiApiKey: string | null = null;
  let existingScenarios: string[] = [];

  if (exampleId) {
    // Get the example
    const example = await db("example").where("id", exampleId).first();

    if (!example) {
      return {
        success: false,
        error: "Example not found",
      };
    }

    // Partners can only generate scenarios for their own examples
    if (accessToken.partner && !accessToken.superAdmin) {
      if (example.partnerId !== accessToken.partnerId) {
        return {
          success: false,
          error: "You can only generate scenarios for your own examples",
        };
      }
    }

    // Get the partner's OpenAI API key
    if (accessToken.partnerId) {
      const partner = await db("partner")
        .where("id", accessToken.partnerId)
        .select("openAiApiKey")
        .first();
      openAiApiKey = partner?.openAiApiKey || null;
    }

    context = example.body || "No specification provided";
    businessName = example.businessName || "the business";

    // Get existing conversation scenarios
    const existingConversations = await db("exampleConversation")
      .where("exampleId", exampleId)
      .select("prompt");

    existingScenarios = existingConversations
      .map((c) => c.prompt)
      .filter((p) => p);
  } else if (quoteId) {
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
        error: "You don't have permission to generate scenarios for this quote",
      };
    }

    // Check if partner has an OpenAI API key
    if (!quote.openAiApiKey) {
      return {
        success: false,
        error: "Partner does not have an OpenAI API key configured",
      };
    }

    openAiApiKey = quote.openAiApiKey;

    // Build the specification context from the 5 fields
    context = `
Background:
${quote.background || "Not specified"}

Objectives:
${quote.objectives || "Not specified"}

Data Sources & Integrations:
${quote.dataSourcesAndIntegrations || "Not specified"}

Other Notes:
${quote.otherNotes || "Not specified"}
    `.trim();

    businessName = quote.organisationName || "the organisation";

    // Get existing conversation scenarios
    const existingConversations = await db("exampleConversation")
      .where("quoteId", quoteId)
      .select("prompt");

    existingScenarios = existingConversations
      .map((c) => c.prompt)
      .filter((p) => p);
  }

  if (!openAiApiKey) {
    return {
      success: false,
      error:
        "Your partner account does not have an OpenAI API key configured. Please contact an administrator.",
    };
  }

  // Create OpenAI client with partner's API key
  const openai = createOpenAI({
    apiKey: openAiApiKey,
  });

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are helping to generate realistic scenario descriptions for an AI WhatsApp chatbot.

The business name is "${businessName}".

Here is the specification for the chatbot:
${context}

${
  existingScenarios.length > 0
    ? `Here are the existing scenarios that have already been created:
${existingScenarios.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Please generate a NEW scenario that is DIFFERENT from these existing ones.`
    : "This will be the first scenario."
}

Generate a single, concise scenario description (2-3 sentences) that:
1. Describes a realistic situation where a user would interact with this chatbot
2. Is different from any existing scenarios
3. Relates to the chatbot's capabilities based on the specification
4. Is specific enough to guide conversation generation but not overly detailed

IMPORTANT: Write a textual DESCRIPTION of the scenario, NOT a script or dialogue. Do NOT use formats like "Client: ... Bot: ..." or any back-and-forth conversation format. Instead, describe the situation in prose, e.g., "A customer wants to reschedule their appointment for next week because they have a conflict."

Most often, the user will send the first message but the bot may also send an outbound marketing message or notification that starts the conversation.

Return ONLY the scenario description text, nothing else.`,
    });

    return {
      success: true,
      data: {
        scenario: text.trim(),
      },
    };
  } catch (error) {
    console.error("Error generating scenario:", error);
    return {
      success: false,
      error: "Failed to generate scenario. Please try again.",
    };
  }
};

export default saGenerateScenario;
