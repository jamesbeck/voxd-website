"use server";

import { Resend } from "resend";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";
import type { ResendDomainStatus, DnsRecord } from "./saGetResendDomainStatus";

export default async function saRecheckPartnerResendDomain(
  partnerId: string,
  domainId: string,
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

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: domainData, error: getError } =
    await resend.domains.get(domainId);
  if (getError || !domainData) {
    throw new Error(`Failed to get domain: ${getError?.message}`);
  }

  if (domainData.name !== partner.sendEmailFromDomain) {
    throw new Error("Domain does not belong to this partner");
  }

  // Trigger re-verification
  const { error: verifyError } = await resend.domains.verify(domainId);
  if (verifyError) {
    throw new Error(`Failed to verify domain: ${verifyError.message}`);
  }

  const { data: updatedData, error: updatedError } =
    await resend.domains.get(domainId);
  if (updatedError || !updatedData) {
    throw new Error(`Failed to get updated domain: ${updatedError?.message}`);
  }

  const isVerified = updatedData.status === "verified";
  await db("partner")
    .update({ sendEmailFromDomainVerified: isVerified })
    .where({ id: partnerId });

  return {
    status: updatedData.status as
      | "verified"
      | "pending"
      | "failed"
      | "temporary_failure"
      | "not_started",
    domain: partner.sendEmailFromDomain,
    domainId: updatedData.id,
    records: updatedData.records.map(
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
