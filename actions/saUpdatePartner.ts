"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdatePartner = async ({
  partnerId,
  name,
  domain,
  colour,
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
}: {
  partnerId: string;
  name?: string;
  domain?: string;
  colour?: string;
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
    colour,
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
  });

  return { success: true };
};

export default saUpdatePartner;
