import { headers } from "next/headers";
import getPartners from "@/lib/getPartners";
import { getDevelopmentPartnerOverride } from "@/lib/development/devPartnerOverride";

export default async function getPartnerFromHeaders() {
  const headersList = await headers();
  const host = headersList.get("host");
  let domain = host?.split(":")[0];

  if (process.env.NODE_ENV === "development") {
    const devDomain =
      (await getDevelopmentPartnerOverride()) ||
      process.env.DEVELOPTMENT_PARTNER_DOMAIN;
    if (devDomain) {
      domain = devDomain;
    }
  }

  if (!domain) {
    return null;
  }

  const partners = await getPartners();
  const partner = partners.find((p) => p.domain === domain);

  if (
    !partner &&
    partners.length > 0 &&
    process.env.NODE_ENV === "development"
  ) {
    const validDomains = partners.map((p) => p.domain);
    throw new Error(
      `Invalid partner domain: "${domain}"\n` +
        `Valid partner domains are:\n` +
        validDomains.map((d) => `  - ${d}`).join("\n"),
    );
  }

  return partner;
}
