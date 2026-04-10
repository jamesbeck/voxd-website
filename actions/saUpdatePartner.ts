"use server";

import { revalidateTag } from "next/cache";
import dns from "dns";
import { Resend } from "resend";
import { Vercel } from "@vercel/sdk";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdatePartner = async ({
  partnerId,
  name,
  domain,
  coreDomain,
  openAiApiKey,
  sendEmailFromDomain,
  salesBotName,
  legalName,
  companyNumber,
  registeredAddress,
  legalEmail,
  goCardlessMandateLink,
  salesEmail,
  accountsEmail,
  organisationId,
  prototypingAgentId,
  salesBotAgentId,
  hourlyRate,
  monthlyBaseFee,
  monthlyPerIntegration,
}: {
  partnerId: string;
  name?: string;
  domain?: string;
  coreDomain?: string;
  openAiApiKey?: string;
  sendEmailFromDomain?: string;
  salesBotName?: string;
  legalName?: string;
  companyNumber?: string;
  registeredAddress?: string;
  legalEmail?: string;
  goCardlessMandateLink?: string;
  salesEmail?: string;
  accountsEmail?: string;
  organisationId?: string | null;
  prototypingAgentId?: string | null;
  salesBotAgentId?: string | null;
  hourlyRate?: number | null;
  monthlyBaseFee?: number | null;
  monthlyPerIntegration?: number | null;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin)
    return {
      success: false,
      error: "You do not have permission to update users.",
    };

  if (!partnerId) {
    return {
      success: false,
      error: "Partner ID is required",
    };
  }

  //find the existing partner
  const existingPartner = await db("partner")
    .select("*")
    .where({ id: partnerId })
    .first();

  if (!existingPartner) {
    return {
      success: false,
      error: "Partner not found",
    };
  }

  //update the partner
  await db("partner").where({ id: partnerId }).update({
    name,
    domain,
    coreDomain,
    openAiApiKey,
    sendEmailFromDomain,
    salesBotName,
    legalName,
    companyNumber,
    registeredAddress,
    legalEmail,
    goCardlessMandateLink,
    salesEmail,
    accountsEmail,
    organisationId,
    prototypingAgentId,
    salesBotAgentId,
    hourlyRate,
    monthlyBaseFee,
    monthlyPerIntegration,
  });

  // If sendEmailFromDomain changed, ensure it exists in Resend
  if (
    sendEmailFromDomain &&
    sendEmailFromDomain !== existingPartner.sendEmailFromDomain
  ) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data: listData } = await resend.domains.list();
      const exists = listData?.data?.find(
        (d) => d.name === sendEmailFromDomain,
      );

      if (!exists) {
        const { data: createData } = await resend.domains.create({
          name: sendEmailFromDomain,
        });
        await db("partner")
          .update({
            sendEmailFromDomainVerified: createData?.status === "verified",
          })
          .where({ id: partnerId });
      } else {
        await db("partner")
          .update({
            sendEmailFromDomainVerified: exists.status === "verified",
          })
          .where({ id: partnerId });
      }
    } catch {
      // Domain creation is best-effort; don't fail the save
    }
  }

  // If domain changed, ensure it exists in Vercel
  if (domain && domain !== existingPartner.domain) {
    try {
      const vercel = new Vercel({ bearerToken: process.env.VERCEL_API_TOKEN! });
      const result = await vercel.projects.getProjectDomains({
        idOrName: process.env.VERCEL_PROJECT_ID!,
        teamId: process.env.VERCEL_TEAM_ID,
        limit: 100,
      });
      const exists = result.domains?.find((d) => d.name === domain);
      if (!exists) {
        await vercel.projects.addProjectDomain({
          idOrName: process.env.VERCEL_PROJECT_ID!,
          teamId: process.env.VERCEL_TEAM_ID,
          requestBody: { name: domain },
        });
      }
    } catch {
      // Domain creation is best-effort; don't fail the save
    }
  }

  // If coreDomain changed, check CNAME points to core.voxd.ai
  if (coreDomain && coreDomain !== existingPartner.coreDomain) {
    if (coreDomain === "core.voxd.ai") {
      await db("partner")
        .update({ coreDomainVerified: true })
        .where({ id: partnerId });
    } else {
      try {
        const addresses = await dns.promises.resolveCname(coreDomain);
        const verified = addresses.some(
          (a) => a.replace(/\.$/, "") === "core.voxd.ai",
        );
        await db("partner")
          .update({ coreDomainVerified: verified })
          .where({ id: partnerId });
      } catch {
        await db("partner")
          .update({ coreDomainVerified: false })
          .where({ id: partnerId });
      }
    }
  }

  revalidateTag("partners", { expire: 0 });

  return { success: true };
};

export default saUpdatePartner;
