"use server";

import { Resend } from "resend";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";

export default async function saCheckAllEmailVerifications(): Promise<{
  success: boolean;
  error?: string;
  data?: { checked: number; verified: number; created: number };
}> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all partner organisations with a sendEmailFromDomain
  const partners = await db("organisation")
    .select("id", "sendEmailFromDomain")
    .where("partner", true)
    .whereNotNull("sendEmailFromDomain")
    .andWhere("sendEmailFromDomain", "!=", "");

  if (partners.length === 0) {
    return { success: true, data: { checked: 0, verified: 0, created: 0 } };
  }

  // List all existing Resend domains once
  const { data: listData, error: listError } = await resend.domains.list();
  if (listError) {
    return {
      success: false,
      error: `Failed to list Resend domains: ${listError.message}`,
    };
  }

  const existingDomains = listData?.data ?? [];
  let verified = 0;
  let created = 0;

  // Group partners by domain to avoid duplicate Resend API calls
  const domainToPartnerIds = new Map<string, string[]>();
  for (const partner of partners) {
    const ids = domainToPartnerIds.get(partner.sendEmailFromDomain) ?? [];
    ids.push(partner.id);
    domainToPartnerIds.set(partner.sendEmailFromDomain, ids);
  }

  for (const [domainName, partnerIds] of domainToPartnerIds) {
    const domain = existingDomains.find((d) => d.name === domainName);

    // Create domain in Resend if it doesn't exist
    if (!domain) {
      const { data: createData, error: createError } =
        await resend.domains.create({ name: domainName });

      if (createError || !createData) {
        continue;
      }

      created++;
      const isVerified = createData.status === "verified";
      if (isVerified) verified++;

      await db("organisation")
        .update({ sendEmailFromDomainVerified: isVerified })
        .whereIn("id", partnerIds);

      continue;
    }

    // Domain exists — check current status first
    if (domain.status === "verified") {
      // Already verified, just sync the DB
      verified++;
      await db("organisation")
        .update({ sendEmailFromDomainVerified: true })
        .whereIn("id", partnerIds);
      continue;
    }

    // Not yet verified — trigger verification and get updated status
    await resend.domains.verify(domain.id);

    const { data: domainData, error: getError } = await resend.domains.get(
      domain.id,
    );

    if (getError || !domainData) continue;

    const isVerified = domainData.status === "verified";
    if (isVerified) verified++;

    await db("organisation")
      .update({ sendEmailFromDomainVerified: isVerified })
      .whereIn("id", partnerIds);
  }

  return {
    success: true,
    data: { checked: partners.length, verified, created },
  };
}
