"use server";

import db from "@/database/db";
import { UAParser } from "ua-parser-js";

type RecordQuoteViewParams = {
  quoteId: string;
  documentViewed: "pitch" | "quote";
  ipAddress: string | null;
  userAgent: string | null;
};

export async function saRecordQuoteView({
  quoteId,
  documentViewed,
  ipAddress,
  userAgent,
}: RecordQuoteViewParams): Promise<void> {
  // Parse user agent
  const parser = new UAParser(userAgent || "");
  const result = parser.getResult();

  // Fetch location data from ipapi.co
  let locationData = null;
  if (
    ipAddress &&
    ipAddress !== "::1" &&
    ipAddress !== "127.0.0.1" &&
    ipAddress !== "localhost"
  ) {
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
        headers: {
          "User-Agent": "Voxd Website",
        },
      });

      if (response.ok) {
        locationData = await response.json();
      }
    } catch (error) {
      // Silently fail - location data is optional
      console.error("Failed to fetch location data:", error);
    }
  }

  await db("quoteView").insert({
    quoteId,
    documentViewed,
    ipAddress,
    userAgent,
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`.trim()
      : null,
    engine: result.engine.name
      ? `${result.engine.name} ${result.engine.version || ""}`.trim()
      : null,
    os: result.os.name
      ? `${result.os.name} ${result.os.version || ""}`.trim()
      : null,
    device: result.device.type
      ? `${result.device.vendor || ""} ${result.device.model || ""} (${
          result.device.type
        })`.trim()
      : null,
    cpu: result.cpu.architecture || null,
    locationData: locationData ? JSON.stringify(locationData) : null,
  });
}
