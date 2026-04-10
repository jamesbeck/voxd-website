"use server";

import { promises as dns } from "dns";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";

const CORE_CNAME_TARGET = "core.voxd.ai";

export type CoreDomainStatus =
  | { status: "not_configured" }
  | { status: "verified"; domain: string; cname: string }
  | { status: "wrong_cname"; domain: string; cname: string }
  | { status: "no_cname"; domain: string };

async function checkCoreDomainCname(
  domainName: string,
): Promise<{ verified: boolean; cname?: string }> {
  try {
    const records = await dns.resolveCname(domainName);
    const cname = records[0]?.replace(/\.$/, "");
    return { verified: cname === CORE_CNAME_TARGET, cname };
  } catch {
    return { verified: false };
  }
}

export async function saGetPartnerCoreDomainStatus(
  partnerId: string,
): Promise<CoreDomainStatus> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    throw new Error("Unauthorized");
  }

  const partner = await db("partner")
    .select("coreDomain")
    .where({ id: partnerId })
    .first();

  if (!partner?.coreDomain) {
    return { status: "not_configured" };
  }

  const domainName = partner.coreDomain;

  // Skip check if it's already core.voxd.ai
  if (domainName === CORE_CNAME_TARGET) {
    await db("partner")
      .update({ coreDomainVerified: true })
      .where({ id: partnerId });
    return { status: "verified", domain: domainName, cname: CORE_CNAME_TARGET };
  }

  const { verified, cname } = await checkCoreDomainCname(domainName);

  await db("partner")
    .update({ coreDomainVerified: verified })
    .where({ id: partnerId });

  if (verified) {
    return { status: "verified", domain: domainName, cname: cname! };
  }

  if (cname) {
    return { status: "wrong_cname", domain: domainName, cname };
  }

  return { status: "no_cname", domain: domainName };
}

export async function saCheckAllCoreDomains(): Promise<{
  success: boolean;
  error?: string;
  data?: { checked: number; verified: number; failed: number };
}> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const partners = await db("partner")
    .select("id", "coreDomain")
    .whereNotNull("coreDomain")
    .andWhere("coreDomain", "!=", "");

  if (partners.length === 0) {
    return { success: true, data: { checked: 0, verified: 0, failed: 0 } };
  }

  // Deduplicate by domain
  const domainToPartnerIds = new Map<string, string[]>();
  for (const partner of partners) {
    const ids = domainToPartnerIds.get(partner.coreDomain) ?? [];
    ids.push(partner.id);
    domainToPartnerIds.set(partner.coreDomain, ids);
  }

  let verified = 0;
  let failed = 0;

  for (const [domainName, partnerIds] of domainToPartnerIds) {
    // Skip core.voxd.ai itself
    if (domainName === CORE_CNAME_TARGET) {
      verified++;
      await db("partner")
        .update({ coreDomainVerified: true })
        .whereIn("id", partnerIds);
      continue;
    }

    const result = await checkCoreDomainCname(domainName);

    await db("partner")
      .update({ coreDomainVerified: result.verified })
      .whereIn("id", partnerIds);

    if (result.verified) {
      verified++;
    } else {
      failed++;
    }
  }

  return {
    success: true,
    data: { checked: domainToPartnerIds.size, verified, failed },
  };
}
