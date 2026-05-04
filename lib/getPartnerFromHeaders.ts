import { headers } from "next/headers";
import getPartners from "@/lib/getPartners";
import { getDevelopmentPartnerOverride } from "@/lib/development/devPartnerOverride";

export default async function getPartnerFromHeaders() {
  const headersList = await headers();
  const host = headersList.get("host");
  let domain = host?.split(":")[0];
  const localDevFallbackDomain = process.env.DEVELOPTMENT_PARTNER_DOMAIN;
  const isLocalhostDomain =
    domain === "localhost" || domain === "127.0.0.1" || domain === "0.0.0.0";

  if (process.env.NODE_ENV === "development") {
    const devDomain =
      (await getDevelopmentPartnerOverride()) || localDevFallbackDomain;
    if (devDomain) {
      domain = devDomain;
    }
  }

  if (!domain) {
    return null;
  }

  const partners = await getPartners();
  let partner = partners.find((p) => p.domain === domain);

  if (
    !partner &&
    process.env.NODE_ENV === "development" &&
    isLocalhostDomain &&
    localDevFallbackDomain
  ) {
    partner = partners.find((p) => p.domain === localDevFallbackDomain);
  }

  if (
    !partner &&
    partners.length > 0 &&
    process.env.NODE_ENV === "development" &&
    !isLocalhostDomain
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
