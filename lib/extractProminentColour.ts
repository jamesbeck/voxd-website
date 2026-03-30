import sharp from "sharp";

/**
 * Extracts the most prominent colour from an image buffer.
 * Handles all image types including SVGs (rasterized via sharp).
 *
 * Prioritises vibrant, bright colours. Falls back to near-black/near-white
 * colours if no vibrant ones are found. Returns a hex string like "#A1B2C3"
 * or null if no prominent colour is found.
 */
export async function extractProminentColour(
  buffer: Buffer,
  extension: string,
): Promise<string | null> {
  try {
    const { data, info } = await sharp(buffer)
      .resize(100, 100, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    type Bucket = {
      count: number;
      rSum: number;
      gSum: number;
      bSum: number;
      satSum: number;
      brightSum: number;
    };

    // Two tiers: vibrant pixels (preferred) and muted/extreme pixels (fallback)
    const vibrantBuckets = new Map<string, Bucket>();
    const fallbackBuckets = new Map<string, Bucket>();

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a < 10) continue;

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      // Quantize to bucket
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      const key = `${qr},${qg},${qb}`;

      // Determine which tier this pixel belongs to
      const isVibrant =
        saturation >= 0.3 && brightness >= 80 && brightness <= 220;

      const targetMap = isVibrant ? vibrantBuckets : fallbackBuckets;

      const existing = targetMap.get(key);
      if (existing) {
        existing.count++;
        existing.rSum += r;
        existing.gSum += g;
        existing.bSum += b;
        existing.satSum += saturation;
        existing.brightSum += brightness;
      } else {
        targetMap.set(key, {
          count: 1,
          rSum: r,
          gSum: g,
          bSum: b,
          satSum: saturation,
          brightSum: brightness,
        });
      }
    }

    // Use vibrant buckets if available, otherwise fall back to all pixels
    const buckets = vibrantBuckets.size > 0 ? vibrantBuckets : fallbackBuckets;

    if (buckets.size === 0) return null;

    // Score each bucket: weight by count, average saturation, and brightness vibrancy.
    // This ensures bright saturated colours beat dark saturated colours that
    // may cover more area (e.g. dark teal text vs a bright green icon).
    let bestBucket: Bucket | null = null;
    let bestScore = 0;
    for (const bucket of buckets.values()) {
      const avgSat = bucket.satSum / bucket.count;
      const avgBright = bucket.brightSum / bucket.count;
      // Brightness factor peaks at mid-range (128) and tapers at extremes
      const brightFactor = 1 - Math.abs(avgBright - 128) / 128;
      const score = bucket.count * avgSat * (0.4 + 0.6 * brightFactor);
      if (score > bestScore) {
        bestScore = score;
        bestBucket = bucket;
      }
    }

    if (!bestBucket || bestBucket.count < 3) return null;

    // Compute average colour in the winning bucket
    const avgR = Math.round(bestBucket.rSum / bestBucket.count);
    const avgG = Math.round(bestBucket.gSum / bestBucket.count);
    const avgB = Math.round(bestBucket.bSum / bestBucket.count);

    // Convert to hex
    const hex =
      `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`.toUpperCase();

    return hex;
  } catch (error) {
    console.error("Error extracting prominent colour:", error);
    return null;
  }
}
