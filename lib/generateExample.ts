"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import slugify from "slugify";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const generateExample = async ({
  prompt,
}: {
  prompt: string;
}): Promise<ServerActionResponse> => {
  const industries = (await db("industry").select("name")).map(
    (industry: { name: string }) => industry.name
  );
  const functions = (await db("function").select("name")).map(
    (func: { name: string }) => func.name
  );

  const { object } = await generateObject({
    model: openai("gpt-5"),
    schema: z.object({
      example: z.object({
        title: z.string(),
        short: z.string(),
        body: z.string(),
        industries: z.array(z.enum(industries)),
        functions: z.array(z.enum(functions)),
        imageGenerationPrompt: z
          .string()
          .describe(
            "A prompt for generating a photo realistic image for the case study. Do not include any example coversations or whatsapp screenshots."
          ),
      }),
    }),
    prompt: `
        You are an expert in writing case studies for AI WhatsApp Chatbots.
        The benefits of WhatsApp include:

        - No apps to download
        - No new logins or passwords
        - Personal familiar experience

        The title should be a short, concise, SEO friendly description of the case study.

        The short description should be a short, concise description of the case study, around 25 words.

        The body of the case study should be written for a non technical audience. It should focus on the benefits of the chatbot to the business but not the technical details of how it works or was deployed. Do not include the title in the body.

        The industries and functions should be selected from the following lists:

        Industries: ${industries.map((industry) => industry).join(", ")}
        Functions: ${functions.map((func) => func).join(", ")}

        Do not include example conversations.

        The body of the case study should be written in HTML and must only include the following tags:

        <h2> - Heading 2
        <h3> - Heading 3
        <p> - Paragraph
        <b> - Bold
        <i> - Italic
        <ul>/<li> - Bulleted list
        <ol>/<li> - Numbered list

        

        Write a case study for:

        ${prompt}

    `,
  });

  console.log(object);

  //translate industries and functions to ids
  const industriesIds = await db("industry")
    .select("id")
    .where("name", "in", object.example.industries);
  const functionsIds = await db("function")
    .select("id")
    .where("name", "in", object.example.functions);

  const newExample = await db("example")
    .insert({
      title: object.example.title,
      slug: slugify(object.example.title, { lower: true, strict: true }),
      short: object.example.short,
      body: object.example.body,
      imageGenerationPrompt: object.example.imageGenerationPrompt,
      prompt: prompt,
    })
    .returning("id");

  await db("exampleIndustry").insert(
    industriesIds.map((industryId) => ({
      exampleId: newExample[0].id,
      industryId: industryId.id,
    }))
  );

  await db("exampleFunction").insert(
    functionsIds.map((functionId) => ({
      exampleId: newExample[0].id,
      functionId: functionId.id,
    }))
  );

  console.log("saved");

  return { success: true, data: newExample };
};

export default generateExample;
