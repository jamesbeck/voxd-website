"use server";

import { Resend } from "resend";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "@/database/db";

export type DnsRecord = {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl: string;
  status: string;
  priority?: number;
};

export type ResendDomainStatus =
  | { status: "not_configured" }
  | {
      status:
        | "verified"
        | "pending"
        | "failed"
        | "temporary_failure"
        | "not_started";
      domain: string;
      domainId: string;
      records: DnsRecord[];
    };

export default async function saGetResendDomainStatus(): Promise<ResendDomainStatus> {
  const accessToken = await verifyAccessToken();
  if (!accessToken?.partner || !accessToken?.partnerId) {
    throw new Error("Unauthorized");
  }

  const partner = await db("partner")
    .select("sendEmailFromDomain")
    .where({ id: accessToken.partnerId })
    .first();

  if (!partner?.sendEmailFromDomain) {
    return { status: "not_configured" };
  }

  const domainName = partner.sendEmailFromDomain;
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Check if domain already exists in Resend
  const { data: listData, error: listError } = await resend.domains.list();

  if (listError) {
    throw new Error(`Failed to list Resend domains: ${listError.message}`);
  }

  let existingDomain = listData?.data?.find((d) => d.name === domainName);

  // Auto-create if not found
  if (!existingDomain) {
    const { data: createData, error: createError } =
      await resend.domains.create({
        name: domainName,
      });

    if (createError) {
      throw new Error(`Failed to create Resend domain: ${createError.message}`);
    }

    if (createData) {
      // Update verified status in DB
      await db("partner")
        .update({
          sendEmailFromDomainVerified: createData.status === "verified",
        })
        .where({ id: accessToken.partnerId });

      return {
        status: createData.status as
          | "pending"
          | "verified"
          | "failed"
          | "temporary_failure"
          | "not_started",
        domain: domainName,
        domainId: createData.id,
        records: createData.records.map((r) => ({
          record: r.record,
          name: r.name,
          value: r.value,
          type: r.type,
          ttl: r.ttl,
          status: r.status,
          priority: "priority" in r ? r.priority : undefined,
        })),
      };
    }
  }

  // Get full domain details with records
  const { data: domainData, error: getError } = await resend.domains.get(
    existingDomain!.id,
  );

  if (getError || !domainData) {
    throw new Error(`Failed to get Resend domain: ${getError?.message}`);
  }

  // Update verified status in DB
  const isVerified = domainData.status === "verified";
  await db("partner")
    .update({ sendEmailFromDomainVerified: isVerified })
    .where({ id: accessToken.partnerId });

  return {
    status: domainData.status as
      | "pending"
      | "verified"
      | "failed"
      | "temporary_failure"
      | "not_started",
    domain: domainName,
    domainId: domainData.id,
    records: domainData.records.map((r) => ({
      record: r.record,
      name: r.name,
      value: r.value,
      type: r.type,
      ttl: r.ttl,
      status: r.status,
      priority: "priority" in r ? r.priority : undefined,
    })),
  };
}
