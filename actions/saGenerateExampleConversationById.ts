"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { emitEvent } from "@/lib/events/eventEmitter";
import saGenerateConversationImages from "./saGenerateConversationImages";

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
              hasImage: z
                .boolean()
                .optional()
                .describe(
                  "Set to true if the user would realistically attach a photo with this message (e.g. showing damage, sharing a product photo, sending a receipt). Only include when it genuinely fits the scenario.",
                ),
              imagePrompt: z
                .string()
                .optional()
                .describe(
                  "When hasImage is true, provide a detailed visual description of the photo the user would send, suitable for AI image generation. Describe it as a realistic phone photo (e.g. 'A slightly blurry phone photo of a cracked laptop screen on a wooden desk'). Keep it concise but descriptive.",
                ),
              hasFile: z
                .boolean()
                .optional()
                .describe(
                  "Set to true if the user would realistically attach a non-image file with this message (e.g. sending a PDF invoice, a spreadsheet, a contract, a CV/resume). Only include when it genuinely fits the scenario.",
                ),
              fileName: z
                .string()
                .optional()
                .describe(
                  "When hasFile is true, provide a realistic filename for the attached document (e.g. 'Invoice_2026_March.pdf', 'Annual_Report.xlsx', 'Contract_v2.docx').",
                ),
              fileSize: z
                .string()
                .optional()
                .describe(
                  "When hasFile is true, provide a realistic human-readable file size string (e.g. '2.4 MB', '156 KB', '1.1 MB').",
                ),
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
              hasImage: z
                .boolean()
                .optional()
                .describe(
                  "Set to true if the bot would realistically send a photo in this message (e.g. sending a product photo, a floorplan image, a photo of a property). Only include when it genuinely fits the scenario.",
                ),
              imagePrompt: z
                .string()
                .optional()
                .describe(
                  "When hasImage is true, provide a detailed visual description of the photo the bot would send, suitable for AI image generation. Keep it concise but descriptive.",
                ),
              hasFile: z
                .boolean()
                .optional()
                .describe(
                  "Set to true if the bot would realistically send a file in this message (e.g. sending a pricelist PDF, a brochure, a floorplan document, a report). Only include when it genuinely fits the scenario.",
                ),
              fileName: z
                .string()
                .optional()
                .describe(
                  "When hasFile is true, provide a realistic filename for the document (e.g. 'Pricelist_2026.pdf', 'Property_Brochure.pdf', 'Floorplan_Unit_4B.pdf').",
                ),
              fileSize: z
                .string()
                .optional()
                .describe(
                  "When hasFile is true, provide a realistic human-readable file size string (e.g. '2.4 MB', '156 KB', '1.1 MB').",
                ),
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

        When the conversation naturally warrants a user sending a photo via WhatsApp (e.g. showing damage to a product, sharing a photo of an item, sending a receipt or document photo), you may set hasImage to true on that user message and provide an imagePrompt describing the realistic phone photo the user would send. Only include images when it genuinely fits the scenario — most conversations won't need images. Not every conversation should have images.

        The bot can also send photos to the user. When the conversation naturally warrants the bot sending a photo (e.g. sharing a product image, sending a photo of a property, showing a floorplan image), you may set hasImage to true on the assistant message and provide an imagePrompt.

        When the conversation naturally warrants a user sending a non-image file via WhatsApp (e.g. a PDF invoice, a spreadsheet, a contract, a CV/resume, a report), you may set hasFile to true on that user message and provide a realistic fileName and fileSize. The fileName should look like a real document name with the correct extension (e.g. 'Invoice_March_2026.pdf', 'Q4_Report.xlsx'). The fileSize should be a realistic human-readable size string (e.g. '2.4 MB', '156 KB'). Only include files when genuinely relevant — most conversations won't have file attachments. A message should not have both an image and a file.

        The bot can also send files to the user (e.g. sending a pricelist, a brochure, a floorplan PDF, a contract). When the bot would realistically send a document, set hasFile to true on the assistant message with a realistic fileName and fileSize.

        Here's the scenario for the chat: ${conversation.prompt}

        Here's the specification for the bot:
        ${context}
      `,
    });

    // Save the generated conversation text first (keep generating=true while images are processed)
    await db("exampleConversation")
      .where("id", conversationId)
      .update({
        messages: JSON.stringify(object.messages),
        description: object.summary,
        startTime: object.startTime,
      });

    // Check if any messages have images to generate
    const hasImages = object.messages.some(
      (msg) => "hasImage" in msg && msg.hasImage === true,
    );

    if (hasImages) {
      await saGenerateConversationImages({
        conversationId,
        openAiApiKey: openAiApiKey!,
      });
    }

    // Mark generation as complete
    await db("exampleConversation")
      .where("id", conversationId)
      .update({ generating: false });

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
