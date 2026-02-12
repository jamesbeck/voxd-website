"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type GenerateScenarioParams = (
  | {
      exampleId: string;
      quoteId?: never;
    }
  | {
      quoteId: string;
      exampleId?: never;
    }
) & {
  count?: number;
};

const saGenerateScenario = async (
  params: GenerateScenarioParams,
): Promise<ServerActionResponse> => {
  const { exampleId, quoteId, count = 1 } = params;

  if (count < 1 || count > 5) {
    return {
      success: false,
      error: "Count must be between 1 and 5",
    };
  }

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

Please generate NEW scenarios that are DIFFERENT from these existing ones.`
    : "These will be the first scenarios."
}

Generate ${count} concise scenario description${count > 1 ? "s" : ""} (2-3 sentences each) that:
1. Describe${count > 1 ? "" : "s"} realistic situation${count > 1 ? "s" : ""} where a user would interact with this chatbot
2. ${count > 1 ? "Are each different from any existing scenarios and from each other" : "Is different from any existing scenarios"}
3. Relate${count > 1 ? "" : "s"} to the chatbot's capabilities based on the specification
4. ${count > 1 ? "Are" : "Is"} specific enough to guide conversation generation but not overly detailed

IMPORTANT: Write textual DESCRIPTIONS of the scenarios, NOT scripts or dialogues. Do NOT use formats like "Client: ... Bot: ..." or any back-and-forth conversation format. Instead, describe the situation in prose, e.g., "A customer wants to reschedule their appointment for next week because they have a conflict."

Most often, the user will send the first message but the bot may also send an outbound marketing message or notification that starts the conversation.

${count > 1 ? `Return ONLY a JSON array of ${count} scenario strings, like: ["scenario 1", "scenario 2", ...]` : "Return ONLY the scenario description text, nothing else."}`,
    });

    if (count === 1) {
      return {
        success: true,
        data: {
          scenario: text.trim(),
          scenarios: [text.trim()],
        },
      };
    }

    // Parse the JSON array for multiple scenarios
    try {
      const cleanedText = text
        .trim()
        .replace(/^```json\n?|```$/g, "")
        .trim();
      const scenarios = JSON.parse(cleanedText) as string[];

      if (!Array.isArray(scenarios) || scenarios.length === 0) {
        throw new Error("Invalid response format");
      }

      return {
        success: true,
        data: {
          scenarios: scenarios.map((s) => s.trim()),
        },
      };
    } catch {
      // Fallback: try to split by newlines if JSON parsing fails
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s*/, "").trim())
        .filter((l) => l.length > 0);

      return {
        success: true,
        data: {
          scenarios: lines.slice(0, count),
        },
      };
    }
  } catch (error) {
    console.error("Error generating scenario:", error);
    return {
      success: false,
      error: "Failed to generate scenario. Please try again.",
    };
  }
};

export default saGenerateScenario;
