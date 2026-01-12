"use server";

import { createOpenAI } from "@ai-sdk/openai";
import {
  generateObject,
  experimental_generateImage as generateImage,
} from "ai";
import { z } from "zod";
import slugify from "slugify";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import generateExampleChat from "./generateExampleChat";
import AWS from "aws-sdk";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const generateExample = async ({
  prompt,
  partnerId,
}: {
  prompt: string;
  partnerId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only partners and super admins can create examples
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "You do not have permission to create examples.",
    };
  }

  // Determine the partnerId to use
  let effectivePartnerId: string | undefined;
  if (accessToken.superAdmin) {
    // Super admin can specify any partnerId (or none)
    effectivePartnerId = partnerId || undefined;
  } else if (accessToken.partner) {
    // Partners can only create examples for themselves
    effectivePartnerId = accessToken.partnerId;
  }

  // Get the partner's OpenAI API key
  // For super admins creating examples without a partner, use the effectivePartnerId if specified
  // Otherwise use the logged-in user's partnerId
  const partnerIdForApiKey = effectivePartnerId || accessToken.partnerId;

  if (!partnerIdForApiKey) {
    return {
      success: false,
      error: "A partner must be selected to generate examples.",
    };
  }

  const partner = await db("partner")
    .where("id", partnerIdForApiKey)
    .select("openAiApiKey", "name")
    .first();

  if (!partner?.openAiApiKey) {
    return {
      success: false,
      error:
        "The selected partner does not have an OpenAI API key configured. Please contact an administrator.",
    };
  }

  const openAiApiKey = partner.openAiApiKey;

  // Create OpenAI client with partner's API key
  const openai = createOpenAI({
    apiKey: openAiApiKey,
  });

  const industries = (await db("industry").select("name")).map(
    (industry: { name: string }) => industry.name
  );
  const functions = (await db("function").select("name")).map(
    (func: { name: string }) => func.name
  );

  const { object } = await generateObject({
    model: openai("gpt-5.2"),
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
          The main body of the case study. It should be written for a non technical audience. It should focus on the benefits of the chatbot to the business but not the technical details of how it works or was technically deployed. Do not include the title in the body. It should be written in Markdown format using:
            ## - Heading 2
            ### - Heading 3
            **text** - Bold
            *text* - Italic
            - item - Bulleted list
            1. item - Numbered list
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
          .default([])
          .describe(
            "REQUIRED: A list of exactly 5 detailed scenarios that the chatbot should be able to handle. Each scenario should be a string describing a realistic user interaction. Include both simple, positive interactions as well as at least one example where the chatbot had to handle a more difficult situation."
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

        IMPORTANT: You MUST include the chatScenarios field with exactly 5 scenario descriptions.

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
      partnerId: effectivePartnerId,
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
    model: openai.image("gpt-image-1"),
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
    endpoint: process.env.NEXT_PUBLIC_WASABI_ENDPOINT,
  });

  await s3.upload(
    {
      Bucket: "voxd",
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

  //generate logo
  const { image: logo } = await generateImage({
    model: openai.image("dall-e-3"),
    prompt: `Generate a logo for the business ${object.example.companyName}`,
    maxImagesPerCall: 1,
    size: "1024x1024",
  });

  //write the image to disk
  const logoBuffer = logo.uint8Array;

  await s3.upload(
    {
      Bucket: "voxd",
      Key: `exampleLogos/${newExample[0].id}.png`,
      Body: logoBuffer,
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

  // Create a partial API key for logging (show first 4 and last 4 characters)
  const partialApiKey =
    openAiApiKey.length > 12
      ? `${openAiApiKey.slice(0, 4)}...${openAiApiKey.slice(-4)}`
      : "****";

  // Log the example creation
  await addLog({
    adminUserId: accessToken.adminUserId,
    partnerId: effectivePartnerId,
    event: "Example Created",
    description: `Generated example "${object.example.title}" for ${
      partner.name || "partner"
    }`,
    data: {
      exampleId: newExample[0].id,
      title: object.example.title,
      businessName: object.example.companyName,
      prompt: prompt,
      generatedOutput: {
        title: object.example.title,
        short: object.example.short,
        companyName: object.example.companyName,
        industries: object.example.industries,
        functions: object.example.functions,
        chatScenarios: object.example.chatScenarios,
      },
      partialApiKey: partialApiKey,
      model: "gpt-5.2",
    },
  });

  return { success: true, data: newExample[0] };
};

export default generateExample;
