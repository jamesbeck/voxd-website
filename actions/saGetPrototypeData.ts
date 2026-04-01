"use server";

import db from "@/database/db";

export type PrototypeData = {
  quoteId: string;
  organisationId: string;
  organisationName: string;
  logoFileExtension: string | null;
  showLogoOnColour: string | null;
  primaryColour: string | null;
  prototypingAgentId: string;
  coreDomain: string | null;
};

export default async function saGetPrototypeData({
  shortLinkId,
}: {
  shortLinkId: string;
}): Promise<PrototypeData | null> {
  const row = await db("quote")
    .join("organisation", "organisation.id", "quote.organisationId")
    .join("partner", "partner.id", "organisation.partnerId")
    .select(
      "quote.id as quoteId",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.logoFileExtension",
      "organisation.showLogoOnColour",
      "organisation.primaryColour",
      "partner.prototypingAgentId",
      "partner.coreDomain",
    )
    .where("quote.shortLinkId", shortLinkId)
    .whereNotNull("partner.prototypingAgentId")
    .first();

  if (!row || !row.prototypingAgentId) return null;

  return {
    quoteId: row.quoteId,
    organisationId: row.organisationId,
    organisationName: row.organisationName || "Company",
    logoFileExtension: row.logoFileExtension || null,
    showLogoOnColour: row.showLogoOnColour || null,
    primaryColour: row.primaryColour || null,
    prototypingAgentId: row.prototypingAgentId,
    coreDomain: row.coreDomain || null,
  };
}
