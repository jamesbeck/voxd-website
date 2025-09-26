"use server";

import { openai } from "@ai-sdk/openai";
import {
  generateObject,
  experimental_generateImage as generateImage,
} from "ai";
import { z } from "zod";
import slugify from "slugify";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import generateExampleChat from "./generateExampleChat";
import fs from "fs";
import AWS from "aws-sdk";

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
        title: z
          .string()
          .describe(
            "The title should be a short, concise, SEO friendly description of the case study."
          ),
        short: z
          .string()
          .describe(
            "A short description should be a concise description of the case study, around 20 words."
          ),
        body: z.string().describe(`
          The main body of the case study. It should be written for a non technical audience. It should focus on the benefits of the chatbot to the business but not the technical details of how it works or was technically deployed. Do not include the title in the body. It should be written in HTML and must only include the following tags:
            <h2> - Heading 2
            <h3> - Heading 3
            <p> - Paragraph
            <b> - Bold
            <i> - Italic
            <ul>/<li> - Bulleted list
            <ol>/<li> - Numbered list
        `),
        companyName: z
          .string()
          .describe(
            "The name of the company (generate an appropriate generic one if we don't have one)"
          ),
        industries: z.array(z.enum(industries)),
        functions: z.array(z.enum(functions)),
        imageGenerationPrompt: z
          .string()
          .describe(
            "A prompt for generating a photo realistic image for the case study. Do not include any mobile phones, example coversations or whatsapp screenshots. The image should be landscape and high-resolution."
          ),
        chatScenarios: z
          .array(z.string())
          .describe(
            "A list of 5 detailed scenarios that the chatbot should be able to handle. The scenarios should be realistic and demonstrate a broad range of capabilities of the chatbot. They should include both simple, positive interactions as well as at least one example where the chat bot had to hand a more difficuly customer/scenario. "
          ),
      }),
    }),
    prompt: `
        You are an expert in writing comprehensive case studies for AI powered WhatsApp Chatbots.

        The benefits of WhatsApp include:
        * No apps to download
        * No new logins or passwords
        * Personal familiar experience

        The industries and functions should be selected from the following lists:

        Do not include example conversations.

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
      chatScenarioPrompts: JSON.stringify(object.example.chatScenarios),
      businessName: object.example.companyName,
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

  //generate image
  const { image } = await generateImage({
    model: openai.imageModel("gpt-image-1"),
    prompt: object.example.imageGenerationPrompt,
    maxImagesPerCall: 1,
    size: "1536x1024",
  });

  //write the image to disk
  const buffer = image.uint8Array;

  //upload the image to wasabi using s3 api
  const s3 = new AWS.S3({
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
    region: process.env.WASABI_REGION,
    endpoint: process.env.WASABI_ENDPOINT,
  });

  await s3.upload(
    {
      Bucket: "swiftreply",
      Key: `exampleImages/${newExample[0].id}.png`,
      Body: buffer,
      ACL: "public-read",
    },
    (err: any, data: any) => {
      if (err) {
        console.log("Error uploading image");
        console.log(err);
      } else {
        console.log(data);
      }
    }
  );

  //generate example conversations
  for (const scenario of object.example.chatScenarios) {
    await generateExampleChat({
      prompt: scenario,
      exampleId: newExample[0].id,
    });
  }

  return { success: true, data: newExample[0] };
};

export default generateExample;
