import "dotenv/config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import db from "../database/db";
import { extractProminentColour } from "../lib/extractProminentColour";

async function main() {
  const bucketName = process.env.WASABI_BUCKET_NAME || "voxd";
  const s3Client = new S3Client({
    region: process.env.WASABI_REGION || "eu-west-1",
    endpoint: `https://s3.${process.env.WASABI_REGION || "eu-west-1"}.wasabisys.com`,
    credentials: {
      accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
      secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  // Find all orgs with a logo but no primary colour
  const orgs = await db("organisation")
    .whereNotNull("logoFileExtension")
    .where("logoFileExtension", "!=", "")
    .where(function () {
      this.whereNull("primaryColour").orWhere("primaryColour", "");
    })
    .select("id", "name", "logoFileExtension");

  console.log(`Found ${orgs.length} organisations with logos but no primary colour.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const org of orgs) {
    const key = `organisationLogos/${org.id}.${org.logoFileExtension}`;
    try {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: key }),
      );

      if (!response.Body) {
        console.log(`  [SKIP] ${org.name || org.id} — no body in S3 response`);
        skipped++;
        continue;
      }

      const arrayBuffer = await response.Body.transformToByteArray();
      const buffer = Buffer.from(arrayBuffer);

      const colour = await extractProminentColour(buffer, org.logoFileExtension);

      if (!colour) {
        console.log(`  [SKIP] ${org.name || org.id} — no prominent colour detected`);
        skipped++;
        continue;
      }

      await db("organisation").where("id", org.id).update({ primaryColour: colour });
      console.log(`  [OK]   ${org.name || org.id} → ${colour}`);
      updated++;
    } catch (err) {
      console.error(`  [FAIL] ${org.name || org.id} — ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
  await db.destroy();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
