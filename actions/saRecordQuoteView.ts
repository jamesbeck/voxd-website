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
  });
}
