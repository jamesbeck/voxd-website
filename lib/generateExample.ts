"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import slugify from "slugify";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
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
        industries: z
          .array(z.enum(industries))
          .describe(
            `Select industries from this list: ${industries.join(", ")}`
          ),
        functions: z
          .array(z.enum(functions))
          .describe(`Select functions from this list: ${functions.join(", ")}`),
      }),
    }),
    prompt: `
        You are an expert in writing comprehensive case studies for AI powered WhatsApp Chatbots.

        The benefits of WhatsApp include:
        * No apps to download
        * No new logins or passwords
        * Personal familiar experience
        
        Include in the case study:
        * An engaging introduction to the business and its challenges
        * How the WhatsApp chatbot was implemented to address these challenges
        * The benefits and results achieved by the business
        * Specific examples of how the chatbot improved customer engagement and operations

        IMPORTANT RULES:
        - Do NOT include example conversations or WhatsApp message flows (these will be handled separately)
        - Do NOT include mock-ups or sample dialogues

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
      prompt: prompt,
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
    description: `Generated case study "${object.example.title}" for ${
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
      },
      partialApiKey: partialApiKey,
      model: "gpt-5.2",
    },
  });

  return { success: true, data: newExample[0] };
};

export default generateExample;
