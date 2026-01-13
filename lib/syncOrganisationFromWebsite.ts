"use server";

import OpenAI from "openai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as cheerio from "cheerio";
import db from "../database/db";
import sharp from "sharp";

export interface SyncOrganisationFromWebsiteResult {
  success: boolean;
  about?: string;
  logoFileExtension?: string;
  logoDarkBackground?: boolean;
  error?: string;
}

/**
 * Uses AI with web search to visit an organisation's website and generate
 * a summary about the organisation including location, what they do,
 * interesting information, and history. Also attempts to find and download
 * the organisation's logo.
 */
const syncOrganisationFromWebsite = async ({
  organisationId,
  webAddress,
}: {
  organisationId: string;
  webAddress: string;
}): Promise<SyncOrganisationFromWebsiteResult> => {
  if (!webAddress || webAddress.trim() === "") {
    return {
      success: false,
      error: "No web address provided",
    };
  }

  // Get the organisation with partner's OpenAI API key
  const organisation = await db("organisation")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .select("organisation.*", "partner.openAiApiKey")
    .where({ "organisation.id": organisationId })
    .first();

  if (!organisation) {
    return {
      success: false,
      error: "Organisation not found",
    };
  }

  if (!organisation.openAiApiKey) {
    return {
      success: false,
      error: "Partner does not have an OpenAI API key configured",
    };
  }

  // Ensure the URL has a protocol
  const url = webAddress.startsWith("http")
    ? webAddress
    : `https://${webAddress}`;

  try {
    // Step 1: Use AI with web search to get the about summary
    const about = await getAboutSummary(organisation.openAiApiKey, url);

    if (!about) {
      return {
        success: false,
        error: "No summary generated",
      };
    }

    // Step 2: Fetch the homepage HTML and find the logo URL
    let logoFileExtension: string | undefined;
    let logoDarkBackground: boolean | undefined;
    try {
      const logoUrl = await findLogoUrl(organisation.openAiApiKey, url);

      if (logoUrl) {
        // Step 3: Download and upload the logo
        const logoResult = await downloadAndUploadLogo(organisationId, logoUrl);
        if (logoResult) {
          logoFileExtension = logoResult.extension;
          logoDarkBackground = logoResult.needsDarkBackground;
        }
      }
    } catch (logoError) {
      console.error("Error processing logo:", logoError);
      // Continue without the logo - don't fail the whole operation
    }

    // Save to the database
    const updateData: {
      about: string;
      logoFileExtension?: string;
      logoDarkBackground?: boolean;
    } = { about };
    if (logoFileExtension) {
      updateData.logoFileExtension = logoFileExtension;
      updateData.logoDarkBackground = logoDarkBackground;
    }

    await db("organisation").where({ id: organisationId }).update(updateData);

    return {
      success: true,
      about,
      logoFileExtension,
      logoDarkBackground,
    };
  } catch (error) {
    console.error("Error syncing organisation from website:", error);
    return {
      success: false,
      error: `Failed to sync from website: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Uses OpenAI with web search to generate an about summary
 */
async function getAboutSummary(
  apiKey: string,
  url: string
): Promise<string | null> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.responses.create({
    model: "gpt-5.2",
    tools: [
      {
        type: "web_search",
        search_context_size: "high",
      },
    ],
    input: `Visit the website at ${url} and provide a summary of the organisation in markdown format.

Your summary should include (where available):
- What the organisation does (their main products/services)
- Their location(s)
- Any interesting information about them
- Brief history if available

Format your response using markdown:
- Use headings (## or ###) to structure sections
- Use bullet points for lists
- Use **bold** for emphasis on key terms

Important: Do NOT include any URLs, website addresses, or source references in your response. Write the content as standalone prose without citations.

Keep the summary concise and factual - no longer than 300 words.

If you cannot access the website or find relevant information, explain what the issue was.`,
  });

  // Extract the text from the response output
  for (const item of response.output) {
    if (item.type === "message" && item.content) {
      for (const content of item.content) {
        if (content.type === "output_text") {
          return content.text;
        }
      }
    }
  }

  return null;
}

/**
 * Fetches the homepage HTML and uses GPT to find the logo URL
 */
async function findLogoUrl(
  apiKey: string,
  url: string
): Promise<string | null> {
  // Fetch the homepage HTML
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage: ${response.status}`);
  }

  const html = await response.text();

  // Extract only the relevant parts of the HTML for logo finding
  const relevantHtml = extractLogoRelevantHtml(html);

  // Use OpenAI to analyze the HTML and find the logo
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing HTML to find logo images. Your task is to find the organisation's main logo URL from the provided HTML snippets.

The HTML has been pre-processed to include only relevant sections:
- Meta tags (og:image, twitter:image, icons)
- Header section
- Elements with "logo" in their class, id, alt, or src attributes

Look for the main company logo (not favicons unless nothing else is available).

Return ONLY the absolute URL of the logo image, nothing else. If the URL is relative, convert it to absolute using the base URL.
If you cannot find a suitable logo, return exactly: null`,
      },
      {
        role: "user",
        content: `Base URL: ${url}

Relevant HTML snippets:
${relevantHtml}

Find the logo URL:`,
      },
    ],
    max_tokens: 500,
    temperature: 0,
  });

  const result = completion.choices[0]?.message?.content?.trim();

  if (!result || result === "null" || result.toLowerCase() === "null") {
    return null;
  }

  // Validate it looks like a URL
  try {
    new URL(result);
    return result;
  } catch {
    // If it's a relative URL, try to make it absolute
    try {
      const absoluteUrl = new URL(result, url).href;
      return absoluteUrl;
    } catch {
      return null;
    }
  }
}

/**
 * Downloads an image from a URL and uploads it to Wasabi storage
 * Returns both the file extension and whether the logo needs a dark background
 */
async function downloadAndUploadLogo(
  organisationId: string,
  logoUrl: string
): Promise<{ extension: string; needsDarkBackground: boolean } | undefined> {
  // Fetch the image
  const response = await fetch(logoUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch logo: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());

  // Determine file extension from content type or URL
  let ext = getExtensionFromContentType(contentType);
  if (!ext) {
    // Try to get from URL
    const urlPath = new URL(logoUrl).pathname;
    const urlExt = urlPath.split(".").pop()?.toLowerCase();
    if (
      urlExt &&
      ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(urlExt)
    ) {
      ext = urlExt;
    }
  }

  if (!ext) {
    // Default to png if we can't determine
    ext = "png";
  }

  // Analyze the logo to determine if it needs a dark background
  const needsDarkBackground = await analyzeLogoBackground(buffer, ext);

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

  // Upload to Wasabi
  const key = `organisationLogos/${organisationId}.${ext}`;

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

  return { extension: ext, needsDarkBackground };
}

/**
 * Extracts only the HTML elements relevant for finding a logo
 */
function extractLogoRelevantHtml(html: string): string {
  const $ = cheerio.load(html);
  const parts: string[] = [];

  // 1. Extract meta tags for og:image, twitter:image
  const metaTags = $(
    'meta[property="og:image"], meta[name="twitter:image"], meta[property="og:logo"]'
  );
  if (metaTags.length > 0) {
    parts.push("<!-- Meta tags -->");
    metaTags.each((_, el) => {
      parts.push($.html(el));
    });
  }

  // 2. Extract link tags for icons/favicons
  const linkTags = $(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (linkTags.length > 0) {
    parts.push("\n<!-- Link/icon tags -->");
    linkTags.each((_, el) => {
      parts.push($.html(el));
    });
  }

  // 3. Extract the header element
  const header = $("header");
  if (header.length > 0) {
    parts.push("\n<!-- Header section -->");
    // Get a cleaned version of the header (remove scripts and styles)
    const headerClone = header.clone();
    headerClone.find("script, style, noscript").remove();
    parts.push(headerClone.html() || "");
  }

  // 4. Extract any elements with "logo" in class, id, alt, or src
  const logoElements = $(
    '[class*="logo" i], [id*="logo" i], [alt*="logo" i], [src*="logo" i], [data-src*="logo" i]'
  );
  if (logoElements.length > 0) {
    parts.push("\n<!-- Elements with 'logo' in attributes -->");
    logoElements.each((_, el) => {
      // Get outer HTML of the element
      const outerHtml = $.html(el);
      // Only add if not too large (skip if it's a huge container)
      if (outerHtml.length < 2000) {
        parts.push(outerHtml);
      }
    });
  }

  // 5. Extract first few img tags from the page (in case logo doesn't have "logo" in name)
  const firstImages = $("img").slice(0, 10);
  if (firstImages.length > 0) {
    parts.push("\n<!-- First images on page -->");
    firstImages.each((_, el) => {
      parts.push($.html(el));
    });
  }

  // 6. Look for SVGs that might be logos (in nav or header areas)
  const navSvgs = $(
    "nav svg, header svg, [class*='brand'] svg, [class*='navbar'] svg"
  ).slice(0, 5);
  if (navSvgs.length > 0) {
    parts.push("\n<!-- SVGs in nav/header -->");
    navSvgs.each((_, el) => {
      const svgHtml = $.html(el);
      // Only include if not too large
      if (svgHtml.length < 5000) {
        parts.push(svgHtml);
      }
    });
  }

  const result = parts.join("\n");

  // If still too large, truncate
  if (result.length > 30000) {
    return result.substring(0, 30000) + "\n<!-- truncated -->";
  }

  return result;
}

function getExtensionFromContentType(contentType: string): string | undefined {
  const mapping: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/webp": "webp",
  };
  return mapping[contentType.split(";")[0].trim()];
}

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

/**
 * Analyzes a logo image to determine if it should be displayed on a dark background.
 *
 * Strategy:
 * 1. For images with transparency: analyze the average brightness of non-transparent pixels
 *    - If mostly light/white pixels, it needs a dark background
 * 2. For images without transparency: analyze the edge pixels (likely background)
 *    - If edges are very light, the logo content is probably dark (light bg OK)
 *    - If edges are dark or image has no clear background, analyze overall brightness
 */
async function analyzeLogoBackground(
  buffer: Buffer,
  extension: string
): Promise<boolean> {
  try {
    const image = sharp(buffer);

    // Resize to a small size for faster analysis (50x50 is enough for color detection)
    const resized = image.resize(50, 50, { fit: "inside" });

    // Get raw pixel data with alpha channel
    const { data, info } = await resized
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const hasAlpha = info.channels === 4;
    const pixels = info.width * info.height;

    let totalBrightness = 0;
    let visiblePixels = 0;
    let transparentPixels = 0;
    let lightPixels = 0; // Pixels with brightness > 200
    let veryLightPixels = 0; // Pixels with brightness > 240 (nearly white)

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = hasAlpha ? data[i + 3] : 255;

      // Skip fully transparent pixels
      if (a < 10) {
        transparentPixels++;
        continue;
      }

      // Calculate perceived brightness (human eye is more sensitive to green)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      // Weight by alpha (semi-transparent pixels count less)
      const weight = a / 255;
      totalBrightness += brightness * weight;
      visiblePixels += weight;

      if (brightness > 200) lightPixels++;
      if (brightness > 240) veryLightPixels++;
    }

    // If no visible pixels, default to light background
    if (visiblePixels < 1) {
      return false;
    }

    const avgBrightness = totalBrightness / visiblePixels;
    const transparencyRatio = transparentPixels / pixels;
    const lightPixelRatio = lightPixels / (pixels - transparentPixels);
    const veryLightPixelRatio = veryLightPixels / (pixels - transparentPixels);

    // If image has a solid background (very low transparency), we never need
    // to add our own background - the logo already has one
    if (transparencyRatio < 0.05) {
      return false;
    }

    // From here, we know the image has transparency, so we need to determine
    // if the visible (non-transparent) pixels are light and need a dark bg

    // 1. If visible pixels are predominantly light, it needs dark background
    if (avgBrightness > 180 || veryLightPixelRatio > 0.3) {
      return true; // Light logo on transparent bg - needs dark background
    }

    // 2. If most visible pixels are very light (>240), needs dark background
    if (veryLightPixelRatio > 0.4) {
      return true;
    }

    // 3. If average brightness is very high, needs dark background
    if (avgBrightness > 200) {
      return true;
    }

    // 4. If a significant portion is light, lean towards dark background
    if (lightPixelRatio > 0.5 && avgBrightness > 150) {
      return true;
    }

    // Default: light background is fine
    return false;
  } catch (error) {
    console.error("Error analyzing logo:", error);
    // Default to light background on error
    return false;
  }
}

export default syncOrganisationFromWebsite;
