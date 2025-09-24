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
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().describe("The content of the message as HTML"),
        })
      ),
    }),
    prompt: `
        Given the content of the below case study. Write a message exchange between a user and an AI WhatsApp Chatbot.

        Please try to make the chat as realistic as possible. The chat bot feels very human like.

        The user always send the first message.

        Please return each message as HTML. Only use the following tags <p>, <a>, <ul>/<li>, <ol>/<li>, <b>, <i>, <br/>.

        The chat should specifically be: ${prompt}

        Case Study:
        ${example.body}

    `,
  });

  console.log(object);

  await db("exampleConversation").insert({
    exampleId: exampleId,
    messages: JSON.stringify(object.messages),
    prompt: prompt,
  });
  // .returning("id");

  return { success: true };
};

export default generateExampleChat;
