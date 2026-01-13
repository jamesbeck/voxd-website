"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

export interface GenerateConversationParams {
  prompt: string;
  openAiApiKey: string;
  context: string;
  businessName: string;
  exampleId?: string;
  quoteId?: string;
}

const generateConversation = async ({
  prompt,
  openAiApiKey,
  context,
  businessName,
  exampleId,
  quoteId,
}: GenerateConversationParams): Promise<ServerActionResponse> => {
  if (!exampleId && !quoteId) {
    return {
      success: false,
      error: "Either exampleId or quoteId must be provided",
    };
  }

  // Create OpenAI client with partner's API key
  const openai = createOpenAI({
    apiKey: openAiApiKey,
  });

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

        The business name is "${businessName}". You can reference this name in the conversation if/when relevant.

        Please try to make the chat as realistic as possible. The chat bot feels very human like.

        Messages should be no longer than around 150 words.

        The user always sends the first message.

        Please return each message as HTML. Only use the following tags <p>, <a>, <ul>/<li>, <ol>/<li>, <b>, <i>, <br/>.

        Here's the scenario for the chat: ${prompt}

        Here's the specification for the bot:
        ${context}
    `,
  });

  await db("exampleConversation").insert({
    exampleId: exampleId || null,
    quoteId: quoteId || null,
    messages: JSON.stringify(object.messages),
    prompt: prompt,
    description: object.summary,
    startTime: object.startTime,
  });

  return { success: true };
};

export default generateConversation;
