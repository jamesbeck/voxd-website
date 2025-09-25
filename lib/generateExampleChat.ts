"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import slugify from "slugify";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { getExampleById } from "./getExamples";

const generateExampleChat = async ({
  prompt,
  exampleId,
}: {
  prompt: string;
  exampleId: string;
}): Promise<ServerActionResponse> => {
  const example = await getExampleById(exampleId);

  const { object } = await generateObject({
    model: openai("gpt-5"),
    schema: z.object({
      summary: z
        .string()
        .describe("A very breif summary of the chat, around 20 words."),
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
              "A shortannotation for the message, around 20 words. Describe what the bot is doing in the message. ONLY annotate the 'assistant' messages, not the user messages."
            )
            .nullable(),
          time: z
            .number()
            .describe(
              "A realistic number of seconds that has elapsed since the last message. Most messages will be quick, around 30 seconds. But some meesages will be sent when certain events happen or when the user takes a long time to respond. Put together a realistic timeline for these messages."
            ),
        })
      ),
    }),
    prompt: `
        Given the content of the below chat bot spec. Write a message exchange between a user and an AI WhatsApp Chatbot.

        Please try to make the chat as realistic as possible. The chat bot feels very human like.

        Messages should be no longer than around 150 words.

        The user always send the first message.

        Please return each message as HTML. Only use the following tags <p>, <a>, <ul>/<li>, <ol>/<li>, <b>, <i>, <br/>.

        Here's the scenario for the chat: ${prompt}

        Here's the specification for the bot:
        ${example.prompt}

    `,
  });

  console.log(object);

  await db("exampleConversation").insert({
    exampleId: exampleId,
    messages: JSON.stringify(object.messages),
    prompt: prompt,
    description: object.summary,
    startTime: object.startTime,
  });
  // .returning("id");

  return { success: true };
};

export default generateExampleChat;
