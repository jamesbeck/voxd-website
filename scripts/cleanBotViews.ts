/**
 * Script to remove bot views from the quoteView table
 * Run with: npx tsx scripts/cleanBotViews.ts
 */

import "dotenv/config";
import db from "../database/db";
import { isPreviewBot } from "../lib/isPreviewBot";

async function cleanBotViews() {
  console.log("Fetching all quote views...");

  const views = await db("quoteView").select("id", "userAgent");

  console.log(`Found ${views.length} total views`);

  const botViewIds: string[] = [];

  for (const view of views) {
    if (isPreviewBot(view.userAgent)) {
      botViewIds.push(view.id);
      console.log(`Bot detected: ${view.userAgent?.substring(0, 80)}...`);
    }
  }

  console.log(`\nFound ${botViewIds.length} bot views to remove`);

  if (botViewIds.length === 0) {
    console.log("No bot views to remove. Exiting.");
    process.exit(0);
  }

  console.log("\nDeleting bot views...");

  const deleted = await db("quoteView").whereIn("id", botViewIds).delete();

  console.log(`Successfully deleted ${deleted} bot views`);

  await db.destroy();
  process.exit(0);
}

cleanBotViews().catch((error) => {
  console.error("Error cleaning bot views:", error);
  process.exit(1);
});
