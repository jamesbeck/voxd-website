/**
 * Script to generate OG images for all existing quotes using the fallback chain:
 * 1. Hero image + org logo overlay
 * 2. Hero image only
 * 3. Org logo centered on colored background
 * 4. Partner logo centered on white background
 *
 * Run with: npx tsx scripts/generateQuoteOgWithLogoForExisting.ts
 */

// Load environment variables BEFORE importing db
import "dotenv/config";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import db from "../database/db";
import { createQuoteOgWithLogo } from "../lib/createQuoteOgWithLogo";

const bucketName = process.env.WASABI_BUCKET_NAME || "voxd";

const s3Client = new S3Client({
  region: process.env.WASABI_REGION || "eu-west-1",
  endpoint: `https://s3.${process.env.WASABI_REGION || "eu-west-1"}.wasabisys.com`,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

async function generateOgForQuote(quote: {
  id: string;
  title: string;
  heroImageFileExtension: string | null;
  organisationId: string;
  organisationLogoFileExtension: string | null;
  organisationLogoDarkBackground: boolean | null;
  partnerDomain: string | null;
  partnerLogoFileExtension: string | null;
}): Promise<boolean> {
  try {
    let heroBuffer: Buffer | null = null;

    // Fetch hero image only if it exists
    if (quote.heroImageFileExtension) {
      const heroKey = `quoteImages/${quote.id}.${quote.heroImageFileExtension}`;
      try {
        const heroResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: heroKey,
          }),
        );

        if (heroResponse.Body) {
          const heroArrayBuffer =
            await heroResponse.Body.transformToByteArray();
          heroBuffer = Buffer.from(heroArrayBuffer);
        }
      } catch {
        // Hero image not found in storage, continue without it
        console.warn(`  ⚠️ Hero image not found for quote ${quote.id}`);
      }
    }

    // Use the shared utility function with fallback chain
    const result = await createQuoteOgWithLogo({
      quoteId: quote.id,
      heroImageBuffer: heroBuffer,
      organisationId: quote.organisationId,
      organisationLogoFileExtension: quote.organisationLogoFileExtension,
      organisationLogoDarkBackground: quote.organisationLogoDarkBackground,
      partnerDomain: quote.partnerDomain,
      partnerLogoFileExtension: quote.partnerLogoFileExtension,
    });

    if (!result.success) {
      console.warn(`  ⚠️ ${result.error}`);
    }

    return result.success;
  } catch (error) {
    console.error(`  ❌ Error processing quote ${quote.id}:`, error);
    return false;
  }
}

async function main() {
  console.log("🔍 Finding all quotes...\n");

  // Get all quotes with organisation and partner info
  const quotes = await db("quote")
    .join("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .select(
      "quote.id",
      "quote.title",
      "quote.heroImageFileExtension",
      "organisation.id as organisationId",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      "organisation.logoDarkBackground as organisationLogoDarkBackground",
      "partner.domain as partnerDomain",
      "partner.logoFileExtension as partnerLogoFileExtension",
    );

  console.log(`📋 Found ${quotes.length} quotes\n`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const quote of quotes) {
    process.stdout.write(`Processing: ${quote.title} (${quote.id})...`);

    // Check if quote has any image source available
    if (
      !quote.heroImageFileExtension &&
      !quote.organisationLogoFileExtension &&
      !(quote.partnerDomain && quote.partnerLogoFileExtension)
    ) {
      console.log(" ⏭️ Skipped (no images available)");
      skippedCount++;
      continue;
    }

    const success = await generateOgForQuote(quote);

    if (success) {
      console.log(" ✅");
      successCount++;
    } else {
      console.log(" ❌");
      failCount++;
    }
  }

  console.log(
    `\n✨ Done! Generated ${successCount} OG images, ${failCount} failed, ${skippedCount} skipped.`,
  );

  await db.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
