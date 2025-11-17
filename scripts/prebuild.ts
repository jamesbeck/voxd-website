import "dotenv/config";
import db from "../database/db";
import fs from "fs";
import path from "path";

async function prebuild() {
  const partners = await db("partner").select("*");

  const output = path.join(process.cwd(), "generated", "partners.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(partners, null, 2));

  console.log(`✅ Generated partners data: ${partners.length} partners`);

  await db.destroy(); // Close the database connection
}

prebuild().catch(console.error);
