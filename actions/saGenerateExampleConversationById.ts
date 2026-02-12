"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { emitEvent } from "@/lib/events/eventEmitter";

const saGenerateExampleConversationById = async ({
  conversationId,
}: {
  conversationId: string;
}): Promise<ServerActionResponse> => {
  if (!conversationId) {
    return { success: false, error: "Conversation ID is required" };
  }

  const accessToken = await verifyAccessToken();
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "Only partners and super admins can generate conversations",
    };
  }

  const conversation = await db("exampleConversation")
    .where("id", conversationId)
    .first();

  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  let openAiApiKey: string | null = null;
  let context: string = "";
  let businessName: string = "";

  if (conversation.exampleId) {
    const example = await db("example")
      .where("id", conversation.exampleId)
      .first();
    if (!example) {
      await markError(conversationId, "Example not found");
      emitEvent(accessToken.adminUserId, {
        type: "conversation.error",
        conversationId,
        error: "Example not found",
      });
      return { success: false, error: "Example not found" };
    }
    if (accessToken.partner && !accessToken.superAdmin) {
      if (example.partnerId !== accessToken.partnerId) {
        await markError(conversationId, "Permission denied");
        emitEvent(accessToken.adminUserId, {
          type: "conversation.error",
          conversationId,
          error: "Permission denied",
        });
        return { success: false, error: "Permission denied" };
      }
    }
    if (accessToken.partnerId) {
      const partner = await db("partner")
        .where("id", accessToken.partnerId)
        .select("openAiApiKey")
        .first();
      openAiApiKey = partner?.openAiApiKey || null;
    }
    context = example.body || "No specification provided";
    businessName = example.businessName || "the business";
  } else if (conversation.quoteId) {
    const quote = await db("quote")
      .leftJoin("organisation", "quote.organisationId", "organisation.id")
      .leftJoin("partner", "organisation.partnerId", "partner.id")
      .where("quote.id", conversation.quoteId)
      .select(
        "quote.*",
        "organisation.name as organisationName",
        "organisation.partnerId",
        "partner.openAiApiKey",
      )
      .first();
    if (!quote) {
      await markError(conversationId, "Quote not found");
      emitEvent(accessToken.adminUserId, {
        type: "conversation.error",
        conversationId,
        error: "Quote not found",
      });
      return { success: false, error: "Quote not found" };
    }
    const isSuperAdmin = accessToken.superAdmin;
    const isOwnerPartner =
      accessToken.partner && accessToken.partnerId === quote.partnerId;
    if (!isSuperAdmin && !isOwnerPartner) {
      await markError(conversationId, "Permission denied");
      emitEvent(accessToken.adminUserId, {
        type: "conversation.error",
        conversationId,
        error: "Permission denied",
      });
      return { success: false, error: "Permission denied" };
    }
    openAiApiKey = quote.openAiApiKey;
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
  }

  if (!openAiApiKey) {
    await markError(conversationId, "No API key configured");
    emitEvent(accessToken.adminUserId, {
      type: "conversation.error",
      conversationId,
      error: "No OpenAI API key configured",
    });
    return { success: false, error: "No OpenAI API key configured" };
  }

  try {
    const openai = createOpenAI({ apiKey: openAiApiKey });

    const { object } = await generateObject({
      model: openai("gpt-5.2"),
      schema: z.object({
        summary: z
          .string()
          .describe("A very brief summary of the chat, around 20 words."),
        startTime: z
          .string()
          .describe(
            "The start time of the chat as a string (HH:mm). Make this realistic based on the action.",
          ),
        messages: z.array(
          z.discriminatedUnion("role", [
            z.object({
              role: z.literal("user"),
              content: z
                .string()
                .describe("The content of the message as HTML"),
              time: z
                .number()
                .describe("Seconds elapsed since the last message."),
            }),
            z.object({
              role: z.literal("assistant"),
              content: z
                .string()
                .describe("The content of the message as HTML"),
              annotation: z
                .string()
                .describe(
                  "A short annotation for assistant messages, around 20 words.",
                ),
              time: z
                .number()
                .describe("Seconds elapsed since the last message."),
            }),
          ]),
        ),
      }),
      prompt: `
        Given the content of the below chat bot specification. Write a message exchange between a user and an AI WhatsApp Chatbot.

        The business name is "${businessName}". You can reference this name in the conversation if/when relevant.

        Please try to make the chat as realistic as possible. The chat bot feels very human like.

        Messages should be no longer than around 150 words.

        The user will always send the first message unless specified in the scenario below. If the bot sends the first message, it's always a generic marketing message or notification that triggers a reply/conversation.

        Please return each message as HTML. Only use the following tags <p>, <a>, <ul>/<li>, <ol>/<li>, <b>, <i>, <br/>.

        Here's the scenario for the chat: ${conversation.prompt}

        Here's the specification for the bot:
        ${context}
      `,
    });

    await db("exampleConversation")
      .where("id", conversationId)
      .update({
        messages: JSON.stringify(object.messages),
        description: object.summary,
        startTime: object.startTime,
        generating: false,
      });

    // Emit success event
    emitEvent(accessToken.adminUserId, {
      type: "conversation.generated",
      conversationId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error generating conversation:", error);
    await markError(conversationId, "Failed to generate");
    emitEvent(accessToken.adminUserId, {
      type: "conversation.error",
      conversationId,
      error: "Failed to generate conversation",
    });
    return { success: false, error: "Failed to generate conversation" };
  }
};

async function markError(conversationId: string, message: string) {
  await db("exampleConversation")
    .where("id", conversationId)
    .update({
      generating: false,
      description: `Error: ${message}`,
    });
}

export default saGenerateExampleConversationById;
