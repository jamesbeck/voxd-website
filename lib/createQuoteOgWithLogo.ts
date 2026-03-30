import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

function parseHexToRgb(
  hex: string | null | undefined,
): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const match = hex.match(
    /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
  );
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

interface CreateQuoteOgWithLogoParams {
  quoteId: string;
  heroImageBuffer?: Buffer | null;
  organisationId: string;
  organisationLogoFileExtension: string | null;
  organisationShowLogoOnColour: string | null;
}

/**
 * Creates an OG image for a quote with the following fallback chain:
 * 1. Hero image + org logo overlay (if both exist)
 * 2. Hero image only (if no org logo)
 * 3. Org logo centered on colored background (if no hero but org logo exists)
 *
 * Stores the result in quoteOgWithLogo/ folder.
 */
export async function createQuoteOgWithLogo({
  quoteId,
  heroImageBuffer,
  organisationId,
  organisationLogoFileExtension,
  organisationShowLogoOnColour,
}: CreateQuoteOgWithLogoParams): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const bucketName = process.env.WASABI_BUCKET_NAME || "voxd";
  const region = process.env.WASABI_REGION || "eu-west-1";

  const s3Client = new S3Client({
    region,
    endpoint: `https://s3.${region}.wasabisys.com`,
    credentials: {
      accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
      secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  try {
    let finalBuffer: Buffer;

    if (heroImageBuffer) {
      // Case 1 & 2: We have a hero image
      finalBuffer = await createHeroWithLogoOverlay(
        heroImageBuffer,
        organisationId,
        organisationLogoFileExtension,
        organisationShowLogoOnColour,
        s3Client,
        bucketName,
      );
    } else if (organisationLogoFileExtension) {
      // Case 3: No hero, but we have an org logo - create colored background with centered logo
      finalBuffer = await createLogoOnBackground(
        organisationId,
        organisationLogoFileExtension,
        organisationShowLogoOnColour,
        s3Client,
        bucketName,
      );
    } else {
      // No images available at all
      return {
        success: false,
        error: "No hero image or organisation logo available",
      };
    }

    // Upload to the quoteOgWithLogo folder
    const ogKey = `quoteOgWithLogo/${quoteId}.webp`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: ogKey,
        Body: finalBuffer,
        ContentType: "image/webp",
        ACL: "public-read",
      }),
    );

    const url = `https://s3.${region}.wasabisys.com/${bucketName}/${ogKey}`;

    return { success: true, url };
  } catch (error) {
    console.error("Error creating OG image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create OG image",
    };
  }
}

/**
 * Creates a hero image with optional logo overlay in bottom left
 */
async function createHeroWithLogoOverlay(
  heroImageBuffer: Buffer,
  organisationId: string,
  organisationLogoFileExtension: string | null,
  organisationShowLogoOnColour: string | null,
  s3Client: S3Client,
  bucketName: string,
): Promise<Buffer> {
  // Resize hero image to OG dimensions (1200x630)
  let compositeImage = sharp(heroImageBuffer).resize(1200, 630, {
    fit: "cover",
    position: "center",
  });

  // If organisation has a logo, overlay it
  if (organisationLogoFileExtension) {
    const logoKey = `organisationLogos/${organisationId}.${organisationLogoFileExtension}`;

    try {
      const logoResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: logoKey,
        }),
      );

      if (logoResponse.Body) {
        const logoArrayBuffer = await logoResponse.Body.transformToByteArray();
        const logoBuffer = Buffer.from(logoArrayBuffer);

        const logoWithBackground = await createLogoPill(
          logoBuffer,
          organisationShowLogoOnColour,
        );

        // Get dimensions of the pill
        const pillMetadata = await sharp(logoWithBackground).metadata();
        const bgHeight = pillMetadata.height || 344;

        // Position in bottom left with padding
        const positionPadding = 40;
        const left = positionPadding;
        const top = 630 - bgHeight - positionPadding;

        compositeImage = compositeImage.composite([
          {
            input: logoWithBackground,
            left,
            top,
          },
        ]);
      }
    } catch (logoError) {
      // If logo fetch fails, continue without the logo
      console.warn(
        "Failed to fetch organisation logo for OG image:",
        logoError,
      );
    }
  }

  return compositeImage.webp({ quality: 85 }).toBuffer();
}

/**
 * Creates an OG image with just the org logo centered on a colored background
 */
async function createLogoOnBackground(
  organisationId: string,
  organisationLogoFileExtension: string,
  organisationShowLogoOnColour: string | null,
  s3Client: S3Client,
  bucketName: string,
): Promise<Buffer> {
  const logoKey = `organisationLogos/${organisationId}.${organisationLogoFileExtension}`;

  const logoResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: logoKey,
    }),
  );

  if (!logoResponse.Body) {
    throw new Error("Organisation logo not found in storage");
  }

  const logoArrayBuffer = await logoResponse.Body.transformToByteArray();
  const logoBuffer = Buffer.from(logoArrayBuffer);

  // Resize logo to be prominent but not too large
  const resizedLogo = await sharp(logoBuffer)
    .resize({
      width: 600,
      height: 300,
      fit: "inside",
    })
    .toBuffer();

  const logoMetadata = await sharp(resizedLogo).metadata();
  const logoWidth = logoMetadata.width || 600;
  const logoHeight = logoMetadata.height || 300;

  // Choose background color based on showLogoOnColour
  const bgColor = parseHexToRgb(organisationShowLogoOnColour) || {
    r: 255,
    g: 255,
    b: 255,
  };

  // Create 1200x630 background and center the logo
  const background = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: bgColor,
    },
  })
    .composite([
      {
        input: resizedLogo,
        left: Math.round((1200 - logoWidth) / 2),
        top: Math.round((630 - logoHeight) / 2),
      },
    ])
    .webp({ quality: 85 })
    .toBuffer();

  return background;
}

/**
 * Creates a logo with a rounded pill background
 */
async function createLogoPill(
  logoBuffer: Buffer,
  showLogoOnColour: string | null,
): Promise<Buffer> {
  // Resize logo - large for visibility in small previews
  const resizedLogo = await sharp(logoBuffer)
    .resize({
      width: 630,
      height: 280,
      fit: "inside",
    })
    .toBuffer();

  // Get the dimensions of the resized logo
  const logoMetadata = await sharp(resizedLogo).metadata();
  const logoWidth = logoMetadata.width || 630;
  const logoHeight = logoMetadata.height || 280;

  // Create a rounded rectangle background for the logo
  const padding = 32;
  const bgWidth = logoWidth + padding * 2;
  const bgHeight = logoHeight + padding * 2;
  const borderRadius = 24;

  // Choose background color based on showLogoOnColour
  const parsed = parseHexToRgb(showLogoOnColour);
  const bgColorHex = parsed
    ? `rgba(${parsed.r},${parsed.g},${parsed.b},0.9)`
    : "rgba(255,255,255,0.9)";

  // Create the background pill with rounded corners using SVG
  const backgroundPill = Buffer.from(
    `<svg width="${bgWidth}" height="${bgHeight}">
      <rect x="0" y="0" width="${bgWidth}" height="${bgHeight}" rx="${borderRadius}" ry="${borderRadius}" fill="${bgColorHex}"/>
    </svg>`,
  );

  // Composite the logo onto the background pill
  const logoWithBackground = await sharp(backgroundPill)
    .composite([
      {
        input: resizedLogo,
        left: padding,
        top: padding,
      },
    ])
    .png()
    .toBuffer();

  return logoWithBackground;
}
