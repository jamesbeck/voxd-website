import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Load environment variables
import "dotenv/config";

const DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "Error: PRODUCTION_DATABASE_URL environment variable is not set"
  );
  process.exit(1);
}

const outputDir = join(process.cwd(), ".copilot");
const outputFile = join(outputDir, "schema.sql");

// Create .copilot directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

try {
  console.log("Dumping database schema...");

  // Use pg_dump to get schema only (no data)
  const schema = execSync(
    `pg_dump "${DATABASE_URL}" --schema-only --no-owner --no-acl`,
    {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    }
  );

  writeFileSync(outputFile, schema);
  console.log(`Schema dumped successfully to ${outputFile}`);
} catch (error) {
  console.error("Error dumping schema:", error);
  process.exit(1);
}
