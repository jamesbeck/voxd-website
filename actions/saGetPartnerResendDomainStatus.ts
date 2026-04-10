"use server";

import { Resend } from "resend";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";
import type { ResendDomainStatus, DnsRecord } from "./saGetResendDomainStatus";

export default async function saGetPartnerResendDomainStatus(
  partnerId: string,
): Promise<ResendDomainStatus> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.superAdmin) {
    throw new Error("Unauthorized");
  }

  const partner = await db("partner")
    .select("sendEmailFromDomain")
    .where({ id: partnerId })
    .first();

  if (!partner?.sendEmailFromDomain) {
    return { status: "not_configured" };
  }

  const domainName = partner.sendEmailFromDomain;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: listData, error: listError } = await resend.domains.list();
  if (listError) {
    throw new Error(`Failed to list Resend domains: ${listError.message}`);
  }

  const existingDomain = listData?.data?.find((d) => d.name === domainName);

  if (!existingDomain) {
    return { status: "not_configured" };
  }

  const { data: domainData, error: getError } = await resend.domains.get(
    existingDomain.id,
  );

  if (getError || !domainData) {
    throw new Error(`Failed to get Resend domain: ${getError?.message}`);
  }

  const isVerified = domainData.status === "verified";
  await db("partner")
    .update({ sendEmailFromDomainVerified: isVerified })
    .where({ id: partnerId });

  return {
    status: domainData.status as
      | "verified"
      | "pending"
      | "failed"
      | "temporary_failure"
      | "not_started",
    domain: domainName,
    domainId: domainData.id,
    records: domainData.records.map(
      (r): DnsRecord => ({
        record: r.record,
        name: r.name,
        value: r.value,
        type: r.type,
        ttl: r.ttl,
        status: r.status,
        priority: "priority" in r ? r.priority : undefined,
      }),
    ),
  };
}
