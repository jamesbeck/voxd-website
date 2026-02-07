import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import fs from "fs";
import path from "path";
import "dotenv/config";
import knex from "knex";

// Create database connection using production database URL
const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

async function generateMissingFeatureBodies() {
  console.log("Starting feature body generation...\n");

  // Get all features
  const featuresWithoutBody = await db("feature").select(
    "id",
    "title",
    "short",
  );

  if (featuresWithoutBody.length === 0) {
    console.log("✅ No features found!");
    process.exit(0);
  }

  console.log(`Found ${featuresWithoutBody.length} features to process:\n`);
  featuresWithoutBody.forEach((f, i) => {
    console.log(`${i + 1}. ${f.title} (${f.id})`);
  });
  console.log("");

  // Get OpenAI API key from a partner in the database
  const partner = await db("partner")
    .whereNotNull("openAiApiKey")
    .select("openAiApiKey")
    .first();

  if (!partner?.openAiApiKey) {
    console.error(
      "❌ Error: No partner found with an OpenAI API key configured",
    );
    await db.destroy();
    process.exit(1);
  }

  const openAiApiKey = partner.openAiApiKey;
  console.log("✅ Found OpenAI API key from partner\n");

  // Read the what-is-voxd.md file
  const voxdInfoPath = path.join(process.cwd(), ".github", "what-is-voxd.md");
  const voxdInfo = fs.readFileSync(voxdInfoPath, "utf-8");

  // Create OpenAI client
  const openai = createOpenAI({
    apiKey: openAiApiKey,
  });

  let successCount = 0;
  let errorCount = 0;

  // Process each feature
  for (const feature of featuresWithoutBody) {
    try {
      console.log(`\n📝 Generating body for: ${feature.title}...`);

      const prompt = `You are a professional marketing content writer for Voxd, a WhatsApp AI chatbot platform.

Your task is to write a comprehensive feature article in Markdown format that:
1. Explains the feature clearly and persuasively
2. Addresses client concerns and builds confidence
3. Shows how it benefits their business
4. Is professional, reassuring, and sales-focused
5. Uses specific details from the Voxd platform capabilities

FEATURE DETAILS:
Title: ${feature.title}
Short Description: ${feature.short || "No short description provided"}

VOXD PLATFORM INFORMATION:
${voxdInfo}

Write a comprehensive markdown article (400-600 words) that:
- Starts with a strong opening paragraph explaining what the feature is and why it matters
- Includes 2-3 detailed sections with subheadings explaining different aspects
- Provides concrete examples of how businesses benefit
- Addresses potential concerns or questions
- Ends with a confident summary of the value
- Uses professional, persuasive language
- Incorporates relevant Voxd platform capabilities and context

Format: Use markdown with proper headings (##, ###), bullet points where appropriate, and emphasis (**bold**, *italic*) for key points.

Do not include the main title (# ${feature.title}) as that will be added separately.

Begin your article:`;

      const result = await generateText({
        model: openai("gpt-5.2"),
        prompt,
      });

      const generatedBody = result.text.trim();

      // Update the feature with the generated body
      await db("feature").where("id", feature.id).update({
        body: generatedBody,
        updatedAt: new Date(),
      });

      console.log(
        `   ✅ Success! Generated ${generatedBody.length} characters`,
      );
      successCount++;
    } catch (error) {
      console.error(
        `   ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${featuresWithoutBody.length}`);
  console.log("=".repeat(50) + "\n");

  await db.destroy();
  process.exit(0);
}

generateMissingFeatureBodies().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
