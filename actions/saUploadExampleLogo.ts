"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUploadExampleLogo = async ({
  exampleId,
  fileBase64,
  fileExtension,
}: {
  exampleId: string;
  fileBase64: string;
  fileExtension: string;
}): Promise<ServerActionResponse> => {
  if (!exampleId) {
    return {
      success: false,
      error: "Example ID is required",
    };
  }

  if (!fileBase64) {
    return {
      success: false,
      error: "File data is required",
    };
  }

  if (!fileExtension) {
    return {
      success: false,
      error: "File extension is required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Only partners and super admins can upload logos
  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "Only partners and super admins can upload logos",
    };
  }

  // Get the example
  const example = await db("example").where("id", exampleId).first();

  if (!example) {
    return {
      success: false,
      error: "Example not found",
    };
  }

  // Partners can only upload logos for their own examples
  if (accessToken.partner && !accessToken.superAdmin) {
    if (example.partnerId !== accessToken.partnerId) {
      return {
        success: false,
        error: "You can only upload logos for your own examples",
      };
    }
  }

  // Validate file extension
  const allowedExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
  const ext = fileExtension.toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return {
      success: false,
      error: `Invalid file type. Allowed types: ${allowedExtensions.join(
        ", "
      )}`,
    };
  }

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, "base64");

    const bucketName = process.env.WASABI_BUCKET_NAME || "voxd";

    // Initialize S3 client for Wasabi - use bucket-specific endpoint
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
    const key = `exampleLogos/${exampleId}.${ext}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ACL: "public-read",
        ContentType: getContentType(ext),
        CacheControl: "public, max-age=31536000",
      })
    );

    // Update the example record with the logo extension
    await db("example").where("id", exampleId).update({
      logoFileExtension: ext,
    });

    return { success: true };
  } catch (error) {
    console.error("Error uploading logo:", error);
    return {
      success: false,
      error: "Failed to upload logo. Please try again.",
    };
  }
};

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
  };
  return contentTypes[ext] || "application/octet-stream";
}

export default saUploadExampleLogo;
