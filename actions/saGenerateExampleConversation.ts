"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

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

  // Create OpenAI client with partner's API key
  const openai = createOpenAI({
    apiKey: openAiApiKey,
  });

  // Use the example's body and businessName as context
  const specificationContext = example.body || "No specification provided";

  const { object } = await generateObject({
    model: openai("gpt-4o"),
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

        The business name is "${
          example.businessName || "the business"
        }". You can reference this name in the conversation if/when relevant.

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
    quoteId: null,
    exampleId: exampleId,
    messages: JSON.stringify(object.messages),
    prompt: prompt,
    description: object.summary,
    startTime: object.startTime,
  });

  return { success: true };
};

export default saGenerateExampleConversation;
