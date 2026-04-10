"use server";

import { Vercel } from "@vercel/sdk";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";

export type VercelDomainStatus =
  | { status: "not_configured" }
  | {
      status: "verified" | "not_verified" | "misconfigured" | "not_found";
      domain: string;
      verified: boolean;
      misconfigured: boolean;
      configuredBy?: string | null;
    };

function getVercelClient() {
  return new Vercel({ bearerToken: process.env.VERCEL_API_TOKEN! });
}

export async function saGetPartnerVercelDomainStatus(
  partnerId: string,
): Promise<VercelDomainStatus> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    throw new Error("Unauthorized");
  }

  const partner = await db("partner")
    .select("domain")
    .where({ id: partnerId })
    .first();

  if (!partner?.domain) {
    return { status: "not_configured" };
  }

  const vercel = getVercelClient();
  const domainName = partner.domain;

  try {
    const domainInfo = await vercel.projects.getProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID!,
      domain: domainName,
      teamId: process.env.VERCEL_TEAM_ID,
    });

    // Get DNS config to check misconfiguration
    const config = await vercel.domains.getDomainConfig({
      domain: domainName,
      teamId: process.env.VERCEL_TEAM_ID,
    });

    const verified = domainInfo.verified ?? false;
    const misconfigured = config.misconfigured ?? false;

    const isFullyVerified = verified && !misconfigured;
    await db("partner")
      .update({ domainVerified: isFullyVerified })
      .where({ id: partnerId });

    if (isFullyVerified) {
      return {
        status: "verified",
        domain: domainName,
        verified: true,
        misconfigured: false,
        configuredBy: config.configuredBy ?? null,
      };
    }

    return {
      status: misconfigured ? "misconfigured" : "not_verified",
      domain: domainName,
      verified,
      misconfigured,
      configuredBy: config.configuredBy ?? null,
    };
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.message?.includes("not found")) {
      await db("partner")
        .update({ domainVerified: false })
        .where({ id: partnerId });
      return {
        status: "not_found",
        domain: domainName,
        verified: false,
        misconfigured: false,
      };
    }
    throw e;
  }
}

export async function saAddPartnerVercelDomain(
  partnerId: string,
): Promise<VercelDomainStatus> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    throw new Error("Unauthorized");
  }

  const partner = await db("partner")
    .select("domain")
    .where({ id: partnerId })
    .first();

  if (!partner?.domain) {
    return { status: "not_configured" };
  }

  const vercel = getVercelClient();
  const domainName = partner.domain;

  await vercel.projects.addProjectDomain({
    idOrName: process.env.VERCEL_PROJECT_ID!,
    teamId: process.env.VERCEL_TEAM_ID,
    requestBody: { name: domainName },
  });

  // Return current status after adding
  return saGetPartnerVercelDomainStatus(partnerId);
}

export async function saCheckAllVercelDomains(): Promise<{
  success: boolean;
  error?: string;
  data?: {
    checked: number;
    verified: number;
    added: number;
    misconfigured: number;
  };
}> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const vercel = getVercelClient();

  // Get all partners with a domain
  const partners = await db("partner")
    .select("id", "domain")
    .whereNotNull("domain")
    .andWhere("domain", "!=", "");

  if (partners.length === 0) {
    return {
      success: true,
      data: { checked: 0, verified: 0, added: 0, misconfigured: 0 },
    };
  }

  // List all existing project domains once
  const result = await vercel.projects.getProjectDomains({
    idOrName: process.env.VERCEL_PROJECT_ID!,
    teamId: process.env.VERCEL_TEAM_ID,
    limit: 100,
  });
  const existingDomains = result.domains ?? [];

  // Deduplicate by domain name
  const domainToPartnerIds = new Map<string, string[]>();
  for (const partner of partners) {
    const ids = domainToPartnerIds.get(partner.domain) ?? [];
    ids.push(partner.id);
    domainToPartnerIds.set(partner.domain, ids);
  }

  let verified = 0;
  let added = 0;
  let misconfigured = 0;

  for (const [domainName, partnerIds] of domainToPartnerIds) {
    const existing = existingDomains.find((d) => d.name === domainName);

    if (!existing) {
      try {
        await vercel.projects.addProjectDomain({
          idOrName: process.env.VERCEL_PROJECT_ID!,
          teamId: process.env.VERCEL_TEAM_ID,
          requestBody: { name: domainName },
        });
        added++;
        await db("partner")
          .update({ domainVerified: false })
          .whereIn("id", partnerIds);
      } catch {
        continue;
      }
      continue;
    }

    if (existing.verified) {
      // Check DNS config
      try {
        const config = await vercel.domains.getDomainConfig({
          domain: domainName,
          teamId: process.env.VERCEL_TEAM_ID,
        });
        if (config.misconfigured) {
          misconfigured++;
          await db("partner")
            .update({ domainVerified: false })
            .whereIn("id", partnerIds);
        } else {
          verified++;
          await db("partner")
            .update({ domainVerified: true })
            .whereIn("id", partnerIds);
        }
      } catch {
        verified++;
        await db("partner")
          .update({ domainVerified: true })
          .whereIn("id", partnerIds);
      }
    } else {
      await db("partner")
        .update({ domainVerified: false })
        .whereIn("id", partnerIds);
    }
  }

  return {
    success: true,
    data: { checked: domainToPartnerIds.size, verified, added, misconfigured },
  };
}
