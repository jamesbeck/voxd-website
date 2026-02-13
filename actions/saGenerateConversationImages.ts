"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const saGenerateConversationImages = async ({
  conversationId,
  openAiApiKey,
}: {
  conversationId: string;
  openAiApiKey: string;
}): Promise<ServerActionResponse> => {
  if (!conversationId) {
    return { success: false, error: "Conversation ID is required" };
  }

  if (!openAiApiKey) {
    return { success: false, error: "OpenAI API key is required" };
  }

  const conversation = await db("exampleConversation")
    .where("id", conversationId)
    .first();

  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  const messages = conversation.messages || [];

  // Find user messages that have hasImage=true but no imageUrl yet
  const imageMessages: { index: number; imagePrompt: string }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (
      msg.role === "user" &&
      msg.hasImage === true &&
      msg.imagePrompt &&
      !msg.imageUrl
    ) {
      imageMessages.push({ index: i, imagePrompt: msg.imagePrompt });
    }
  }

  if (imageMessages.length === 0) {
    return { success: true, data: { imagesGenerated: 0 } };
  }

  try {
    const openai = createOpenAI({ apiKey: openAiApiKey });

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

    const bucketName = process.env.WASABI_BUCKET_NAME || "voxd";

    for (const { index, imagePrompt } of imageMessages) {
      try {
        // Generate image using GPT-5.2 image generation tool
        const result = await generateText({
          model: openai("gpt-5.2"),
          prompt: imagePrompt,
          tools: {
            image_generation: openai.tools.imageGeneration({
              outputFormat: "webp",
              size: "1024x1024",
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
          console.error(
            `No image data received for message ${index} in conversation ${conversationId}`,
          );
          continue;
        }

        // Upload to Wasabi
        const buffer = Buffer.from(imageBase64, "base64");
        const key = `exampleConversationImages/${conversationId}_${index}.webp`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: "image/webp",
            ACL: "public-read",
          }),
        );

        // Set the imageUrl on the message object
        const imageUrl = `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/${bucketName}/${key}`;
        messages[index].imageUrl = imageUrl;
      } catch (imageError) {
        console.error(
          `Error generating image for message ${index} in conversation ${conversationId}:`,
          imageError,
        );
        // Continue with other images even if one fails
      }
    }

    // Update the conversation with the image URLs
    await db("exampleConversation")
      .where("id", conversationId)
      .update({
        messages: JSON.stringify(messages),
      });

    return {
      success: true,
      data: {
        imagesGenerated: imageMessages.length,
      },
    };
  } catch (error) {
    console.error("Error generating conversation images:", error);
    return {
      success: false,
      error: "Failed to generate conversation images",
    };
  }
};

export default saGenerateConversationImages;
