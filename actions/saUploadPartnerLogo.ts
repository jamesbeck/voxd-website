"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";
import sharp from "sharp";

const saUploadPartnerLogo = async ({
  partnerId,
  fileBase64,
  fileExtension,
}: {
  partnerId: string;
  fileBase64: string;
  fileExtension: string;
}): Promise<ServerActionResponse> => {
  if (!partnerId) {
    return {
      success: false,
      error: "Partner ID is required",
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

  // Get the partner
  const partner = await db("partner").where("id", partnerId).first();

  if (!partner) {
    return {
      success: false,
      error: "Partner not found",
    };
  }

  // Authorization check: must be super admin
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to upload logos for partners",
    };
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

    // Upload to Wasabi using partner domain as the key
    const key = `partnerLogos/${partner.domain}.${ext}`;
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

    // Update the partner record with the logo extension
    await db("partner").where("id", partnerId).update({
      logoFileExtension: ext,
    });

    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "PARTNER_LOGO_UPLOADED",
      data: {
        partnerId,
        fileExtension: ext,
      },
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

export default saUploadPartnerLogo;
