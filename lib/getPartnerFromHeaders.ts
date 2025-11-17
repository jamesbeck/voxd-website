import { headers } from "next/headers";
import partners from "@/generated/partners.json";

export default async function getPartnerFromHeaders() {
  const headersList = await headers();
  const host = headersList.get("host");
  let domain = host?.split(":")[0];

  if (process.env.NODE_ENV === "development") {
    domain = process.env.DEVELOPTMENT_PARTNER_DOMAIN || domain;
  }

  if (!domain) {
    return null;
  }

  const partner = partners.find((p) => p.domain === domain);

  return partner;
}
