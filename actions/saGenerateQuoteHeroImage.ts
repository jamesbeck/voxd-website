"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const saGenerateQuoteHeroImage = async ({
  quoteId,
  userPrompt,
}: {
  quoteId: string;
  userPrompt?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Only partners and super admins can generate hero images
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "Only partners and super admins can generate hero images",
    };
  }

  // Get the quote with organisation details
  const quote = await db("quote")
    .where("quote.id", quoteId)
    .join("organisation", "quote.organisationId", "organisation.id")
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "organisation.partnerId",
    )
    .first();

  if (!quote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Partners can only generate hero images for their own quotes
  if (accessToken.partner && !accessToken.superAdmin) {
    if (quote.partnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You can only generate hero images for your own quotes",
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

  try {
    // Create OpenAI client with partner's API key
    const openai = createOpenAI({
      apiKey: openAiApiKey,
    });

    // Step 1: Generate hero image prompt using gpt-5-nano
    const promptGenerationResult = await generateText({
      model: openai("gpt-5-nano"),
      prompt: `Create a short prompt for generating a hero image.

Organisation: ${quote.organisationName || "the organisation"}
Background: ${quote.background?.substring(0, 200) || "No description"}
${userPrompt ? `Style: ${userPrompt}` : ""}

Write a brief hero image prompt (max 2 sentences) for a professional website banner. Focus on visual atmosphere and industry context.`,
    });

    const heroPrompt = promptGenerationResult.text.trim();

    // Add landscape and professional styling
    const finalPrompt = `Professional hero banner image for ${
      quote.organisationName || "the organisation"
    }. ${heroPrompt}. Landscape format, professional photography style, clean composition.  Avoid including any text or people in the image.`;

    console.log("Generated hero image prompt:", finalPrompt);

    // Step 2: Generate the hero image using image generation tool
    const result = await generateText({
      model: openai("gpt-5"),
      prompt: finalPrompt,
      tools: {
        image_generation: openai.tools.imageGeneration({
          outputFormat: "webp",
        }),
      },
    });

    // Extract the base64 image from tool results
    let imageBase64: string | null = null;
    for (const toolResult of result.staticToolResults) {
      if (toolResult.toolName === "image_generation") {
        imageBase64 = toolResult.output.result;
        break;
      }
    }

    if (!imageBase64) {
      return {
        success: false,
        error: "No image data received from image generation tool",
      };
    }

    // Step 3: Upload to Wasabi
    const buffer = Buffer.from(imageBase64, "base64");
    const bucketName = process.env.WASABI_BUCKET_NAME || "voxd";
    const fileExtension = "webp";

    // Initialize S3 client for Wasabi
    const s3Client = new S3Client({
      region: process.env.WASABI_REGION || "eu-west-1",
      endpoint: `https://s3.${
        process.env.WASABI_REGION || "eu-west-1"
      }.wasabisys.com`,
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    // Upload to Wasabi
    const key = `quoteImages/${quoteId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      ACL: "public-read",
    });

    await s3Client.send(command);

    // Step 3b: Create optimized OG version (1200x630, <600KB for WhatsApp)
    const ogBuffer = await sharp(buffer)
      .resize(1200, 630, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    const ogKey = `quoteImages/${quoteId}_og.${fileExtension}`;

    const ogCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: ogKey,
      Body: ogBuffer,
      ContentType: "image/webp",
      ACL: "public-read",
    });

    await s3Client.send(ogCommand);

    // Step 4: Update database
    await db("quote").where("id", quoteId).update({
      heroImageFileExtension: fileExtension,
    });

    // Step 5: Log the action
    await addLog({
      adminUserId: accessToken.adminUserId,
      partnerId: quote.partnerId,
      event: "Hero Image Generated",
      description: `Generated hero image for quote "${quote.title}"`,
      data: {
        quoteId,
        organisationName: quote.organisationName,
        generatedPrompt: finalPrompt,
        userPrompt: userPrompt || null,
        model: "gpt-5-image-generation",
      },
    });

    return {
      success: true,
      data: {
        url: `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/${bucketName}/${key}`,
        prompt: finalPrompt,
      },
    };
  } catch (error) {
    console.error("Error generating hero image:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating the hero image",
    };
  }
};

export default saGenerateQuoteHeroImage;
