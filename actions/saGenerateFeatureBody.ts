"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import fs from "fs";
import path from "path";

const saGenerateFeatureBody = async ({
  featureId,
  title,
  short,
}: {
  featureId: string;
  title: string;
  short: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can generate feature content
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to generate feature content.",
    };
  }

  // Get the feature
  const feature = await db("feature").where("id", featureId).first();

  if (!feature) {
    return {
      success: false,
      error: "Feature not found.",
    };
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

  try {
    // Read the what-is-voxd.md file
    const voxdInfoPath = path.join(process.cwd(), ".github", "what-is-voxd.md");
    const voxdInfo = fs.readFileSync(voxdInfoPath, "utf-8");

    // Create OpenAI client with partner's API key
    const openai = createOpenAI({
      apiKey: openAiApiKey,
    });

    const prompt = `You are a professional marketing content writer for Voxd, a WhatsApp AI chatbot platform.

Your task is to write a comprehensive feature article in Markdown format that:
1. Explains the feature clearly and persuasively
2. Addresses client concerns and builds confidence
3. Shows how it benefits their business
4. Is professional, reassuring, and sales-focused
5. Uses specific details from the Voxd platform capabilities

FEATURE DETAILS:
Title: ${title}
Short Description: ${short || "No short description provided"}

VOXD PLATFORM INFORMATION:
${voxdInfo}

Write a comprehensive markdown article (400-600 words) that:
- Starts with a strong opening paragraph explaining what the feature is and why it matters
- Includes 2-3 detailed sections with subheadings explaining different aspects
- Provides concrete examples of how businesses benefit
- Addresses potential concerns or questions
- Ends with a confident summary of the value
- Uses professional, persuasive language
- Incorporates relevant Voxd platform capabilities and context

Format: Use markdown with proper headings (##, ###), bullet points where appropriate, and emphasis (**bold**, *italic*) for key points.

Do not include the main title (# ${title}) as that will be added separately.

Begin your article:`;

    const result = await generateText({
      model: openai("gpt-5.2"),
      prompt,
    });

    const generatedBody = result.text.trim();

    // Update the feature with the generated body
    await db("feature").where("id", featureId).update({
      body: generatedBody,
      updatedAt: new Date(),
    });

    return {
      success: true,
      data: { body: generatedBody },
    };
  } catch (error) {
    console.error("Error generating feature body:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while generating the feature content",
    };
  }
};

export default saGenerateFeatureBody;
