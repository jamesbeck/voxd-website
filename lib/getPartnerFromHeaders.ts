import { headers } from "next/headers";
import partners from "@/generated/partners.json";

export default async function getPartnerFromHeaders() {
  const headersList = await headers();
  const host = headersList.get("host");
  let domain = host?.split(":")[0];

  if (process.env.NODE_ENV === "development") {
    const devDomain = process.env.DEVELOPTMENT_PARTNER_DOMAIN;
    if (devDomain) {
      domain = devDomain;
    }
  }

  if (!domain) {
    return null;
  }

  const partner = partners.find((p) => p.domain === domain);

  if (!partner && process.env.NODE_ENV === "development") {
    const validDomains = partners.map((p) => p.domain);
    throw new Error(
      `Invalid partner domain: "${domain}"\n` +
        `Valid partner domains are:\n` +
        validDomains.map((d) => `  - ${d}`).join("\n")
    );
  }

  return partner;
}
