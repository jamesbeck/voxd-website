"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

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
      "partner.openAiApiKey"
    )
    .first();

  if (!quote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Check if user is admin or the partner that owns this quote
  const isAdmin = accessToken.admin;
  const isOwnerPartner =
    accessToken.partner && accessToken.partnerId === quote.partnerId;

  if (!isAdmin && !isOwnerPartner) {
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

  // Create OpenAI client with partner's API key
  const openai = createOpenAI({
    apiKey: quote.openAiApiKey,
  });

  // Build the specification context from the 5 fields
  const specificationContext = `
Background:
${quote.background || "Not specified"}

Objectives:
${quote.objectives || "Not specified"}

Data Sources:
${quote.dataSources || "Not specified"}

Integration Requirements:
${quote.integrationRequirements || "Not specified"}

Other Notes:
${quote.otherNotes || "Not specified"}
  `.trim();

  const { object } = await generateObject({
    model: openai("gpt-5.2"),
    schema: z.object({
      summary: z
        .string()
        .describe("A very brief summary of the chat, around 20 words."),
      startTime: z
        .string()
        .describe(
          "The start time of the chat as a string (HH:mm). Make this realistic based on the action, e.g. if the user is ordering food, it should be around lunch/dinner time."
        ),
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().describe("The content of the message as HTML"),
          annotation: z
            .string()
            .describe(
              "A short annotation for the message, around 20 words. Describe what the bot is doing in the message. ONLY annotate the 'assistant' messages, not the user messages."
            )
            .nullable()
            .optional(),
          time: z
            .number()
            .describe(
              "A realistic number of seconds that has elapsed since the last message. Most messages will be quick, around 30 seconds. But some messages will be sent when certain events happen or when the user takes a long time to respond. Put together a realistic timeline for these messages."
            ),
        })
      ),
    }),
    prompt: `
        Given the content of the below chat bot specification. Write a message exchange between a user and an AI WhatsApp Chatbot.

        The organisation name is "${quote.organisationName}". You can reference this name in the conversation if/when relevant.

        Please try to make the chat as realistic as possible. The chat bot feels very human like.

        Messages should be no longer than around 150 words.

        The user always sends the first message.

        Please return each message as HTML. Only use the following tags <p>, <a>, <ul>/<li>, <ol>/<li>, <b>, <i>, <br/>.

        Here's the scenario for the chat: ${prompt}

        Here's the specification for the bot:
        ${specificationContext}
    `,
  });

  await db("exampleConversation").insert({
    quoteId: quoteId,
    exampleId: null,
    messages: JSON.stringify(object.messages),
    prompt: prompt,
    description: object.summary,
    startTime: object.startTime,
  });

  return { success: true };
};

export default saGenerateQuoteExampleConversation;
