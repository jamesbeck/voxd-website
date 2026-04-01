"use server";

import { revalidateTag } from "next/cache";
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
  });

  revalidateTag("partners", { expire: 0 });

  return { success: true };
};

export default saUpdatePartner;
