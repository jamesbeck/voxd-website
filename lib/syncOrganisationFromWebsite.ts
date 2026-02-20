"use server";

import OpenAI from "openai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as cheerio from "cheerio";
import db from "../database/db";
import sharp from "sharp";

/** Headers that mimic a real browser to avoid WAF/CDN 403 blocks */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

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
  url: string,
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
 * Fetches the homepage HTML and uses multiple strategies to find the logo URL.
 * Priority: 1) JSON-LD structured data, 2) Deterministic HTML heuristics, 3) GPT fallback
 */
async function findLogoUrl(
  apiKey: string,
  url: string,
): Promise<string | null> {
  // Fetch the homepage HTML
  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage: ${response.status}`);
  }

  const html = await response.text();

  // Strategy 1: Try JSON-LD structured data (most reliable, no AI needed)
  const structuredDataLogo = findLogoFromStructuredData(html, url);
  if (structuredDataLogo) {
    return structuredDataLogo;
  }

  // Strategy 2: Try deterministic HTML heuristics (no AI needed)
  const htmlLogo = findLogoFromHtml(html, url);
  if (htmlLogo) {
    return htmlLogo;
  }

  // Strategy 3: Fall back to GPT analysis
  return findLogoWithGpt(apiKey, url, html);
}

/**
 * Extracts logo URL from JSON-LD structured data (schema.org).
 * Common on WordPress/Yoast sites and many modern websites.
 */
function findLogoFromStructuredData(
  html: string,
  baseUrl: string,
): string | null {
  const $ = cheerio.load(html);
  const logoUrls: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html();
      if (!jsonText) return;
      const data = JSON.parse(jsonText);
      extractLogoUrlsFromJsonLd(data, logoUrls);
    } catch {
      // Skip malformed JSON-LD blocks
    }
  });

  // Return the first valid image URL found
  for (const logoUrl of logoUrls) {
    const resolved = resolveUrl(logoUrl, baseUrl);
    if (resolved && isImageUrl(resolved)) {
      return resolved;
    }
  }

  return null;
}

/**
 * Recursively searches a JSON-LD object for logo URLs.
 * Handles both "logo": "url" and "logo": { "url": "..." } formats,
 * as well as @graph arrays.
 */
function extractLogoUrlsFromJsonLd(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  results: string[],
): void {
  if (!data || typeof data !== "object") return;

  // Handle @graph arrays
  if (Array.isArray(data)) {
    for (const item of data) {
      extractLogoUrlsFromJsonLd(item, results);
    }
    return;
  }

  // Check for logo property
  if (data.logo) {
    if (typeof data.logo === "string") {
      results.push(data.logo);
    } else if (typeof data.logo === "object") {
      if (data.logo.url) results.push(data.logo.url);
      if (data.logo.contentUrl) results.push(data.logo.contentUrl);
    }
  }

  // Recurse into nested objects (e.g. @graph, publisher, etc.)
  for (const key of Object.keys(data)) {
    if (key === "logo") continue; // Already handled above
    if (typeof data[key] === "object" && data[key] !== null) {
      extractLogoUrlsFromJsonLd(data[key], results);
    }
  }
}

/**
 * Uses deterministic HTML heuristics to find the logo.
 * Looks for img/a elements with "logo" in class/alt/src attributes,
 * filtering out favicons and tiny icons.
 */
function findLogoFromHtml(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates: { url: string; score: number }[] = [];

  // Look for img elements with "logo" in their attributes
  $(
    'img[class*="logo" i], img[alt*="logo" i], img[src*="logo" i], img[data-src*="logo" i]',
  ).each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;

    const resolved = resolveUrl(src, baseUrl);
    if (!resolved || !isImageUrl(resolved)) return;

    // Skip favicons and tiny icons
    if (isFaviconOrIcon(resolved, el, $)) return;

    let score = 0;

    // Higher score for "custom-logo" class (WordPress standard)
    const className = $(el).attr("class") || "";
    if (/custom-logo|site-logo|brand-logo/i.test(className)) score += 3;
    if (/logo/i.test(className)) score += 2;

    // Higher score if alt text contains the site name
    const alt = $(el).attr("alt") || "";
    if (alt && alt.length > 0 && /logo/i.test(alt)) score += 1;

    // Higher score if inside header or nav
    if (
      $(el).closest('header, nav, [class*="header" i], [class*="navbar" i]')
        .length > 0
    ) {
      score += 2;
    }

    // Higher score if wrapped in a home link
    const parentLink = $(el).closest('a[href="/"], a[rel="home"]');
    if (parentLink.length > 0) score += 2;

    candidates.push({ url: resolved, score });
  });

  // Sort by score descending and return the best candidate
  candidates.sort((a, b) => b.score - a.score);

  // Only return if we have a reasonably confident match (score >= 3)
  if (candidates.length > 0 && candidates[0].score >= 3) {
    return candidates[0].url;
  }

  return null;
}

/**
 * Checks if a URL/element looks like a favicon or tiny icon rather than a logo.
 */
function isFaviconOrIcon(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: any,
  $: cheerio.CheerioAPI,
): boolean {
  const lowerUrl = url.toLowerCase();
  if (/favicon|\bicon\b/i.test(lowerUrl)) return true;

  // Check for very small dimensions in the URL (e.g. 32x32, 16x16)
  if (/(?:^|[^\d])(?:16|32|48)x(?:16|32|48)(?:[^\d]|$)/.test(lowerUrl))
    return true;

  // Check width/height attributes
  const width = parseInt($(el).attr("width") || "0", 10);
  const height = parseInt($(el).attr("height") || "0", 10);
  if (width > 0 && width < 50 && height > 0 && height < 50) return true;

  return false;
}

/**
 * Falls back to GPT to analyze HTML and find the logo URL.
 */
async function findLogoWithGpt(
  apiKey: string,
  url: string,
  html: string,
): Promise<string | null> {
  // Extract only the relevant parts of the HTML for logo finding
  const relevantHtml = extractLogoRelevantHtml(html);

  // Use OpenAI to analyze the HTML and find the logo
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing HTML to find logo images. Your task is to find the organisation's main logo URL from the provided HTML snippets.

The HTML has been pre-processed to include only relevant sections:
- JSON-LD structured data (schema.org)
- Meta tags (og:image, twitter:image, icons)
- Header section
- Elements with "logo" in their class, id, alt, or src attributes

Priority order for identifying the logo:
1. JSON-LD structured data "logo" property
2. Images with "logo" in class/alt/src inside header or nav
3. Images with "custom-logo" or "site-logo" class
4. Other images with "logo" in their attributes
5. og:image ONLY if it appears to be a logo (not a photo)

Do NOT select og:image if it appears to be a photograph or banner image.
Do NOT select favicons or tiny icons unless nothing else is available.

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
    // Try to extract a URL from the response text (GPT sometimes adds explanation)
    const urlMatch = result.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) {
      try {
        new URL(urlMatch[0]);
        return urlMatch[0];
      } catch {
        // fall through
      }
    }

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
 * Resolves a URL (potentially relative) against a base URL.
 * Returns null if the URL is invalid.
 */
function resolveUrl(url: string, baseUrl: string): string | null {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL points to a common image format.
 */
function isImageUrl(url: string): boolean {
  const pathname = new URL(url).pathname.toLowerCase();
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|avif)$/i.test(pathname);
}

/**
 * Downloads an image from a URL and uploads it to Wasabi storage
 * Returns both the file extension and whether the logo needs a dark background
 */
async function downloadAndUploadLogo(
  organisationId: string,
  logoUrl: string,
): Promise<{ extension: string; needsDarkBackground: boolean } | undefined> {
  // Fetch the image
  const response = await fetch(logoUrl, {
    headers: {
      ...BROWSER_HEADERS,
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Sec-Fetch-Dest": "image",
      "Sec-Fetch-Mode": "no-cors",
    },
    redirect: "follow",
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
    }),
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
    'meta[property="og:image"], meta[name="twitter:image"], meta[property="og:logo"]',
  );
  if (metaTags.length > 0) {
    parts.push("<!-- Meta tags -->");
    metaTags.each((_, el) => {
      parts.push($.html(el));
    });
  }

  // 2. Extract link tags for icons/favicons
  const linkTags = $(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
  );
  if (linkTags.length > 0) {
    parts.push("\n<!-- Link/icon tags -->");
    linkTags.each((_, el) => {
      parts.push($.html(el));
    });
  }

  // 2.5. Extract JSON-LD structured data (often contains explicit logo declarations)
  const jsonLdScripts = $('script[type="application/ld+json"]');
  if (jsonLdScripts.length > 0) {
    parts.push("\n<!-- JSON-LD structured data -->");
    jsonLdScripts.each((_, el) => {
      const content = $(el).html();
      if (content && content.length < 5000) {
        parts.push(content);
      }
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
    '[class*="logo" i], [id*="logo" i], [alt*="logo" i], [src*="logo" i], [data-src*="logo" i]',
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
    "nav svg, header svg, [class*='brand'] svg, [class*='navbar'] svg",
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
  extension: string,
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
