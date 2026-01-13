import db from "../database/db";

export type PublicPitch = {
  id: string;
  title: string;
  createdAt: string;
  organisationName: string;
  organisationId: string;
  organisationLogoFileExtension: string | null;
  organisationLogoDarkBackground: boolean;
  status: string;
  pitchPersonalMessage: string | null;
  generatedPitchIntroduction: string | null;
  generatedPitch: string | null;
  partner: {
    name: string;
    colour: string | null;
    domain: string | null;
  };
  createdBy: {
    name: string | null;
    email: string | null;
  } | null;
};

export const getPitchForPublic = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<PublicPitch | null> => {
  const quote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .leftJoin("adminUser", "quote.createdByAdminUserId", "adminUser.id")
    .where("quote.id", quoteId)
    .select(
      "quote.id",
      "quote.title",
      "quote.createdAt",
      "quote.status",
      "quote.pitchPersonalMessage",
      "quote.generatedPitchIntroduction",
      "quote.generatedPitch",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      "organisation.logoDarkBackground as organisationLogoDarkBackground",
      "partner.name as partnerName",
      "partner.colour as partnerColour",
      "partner.domain as partnerDomain",
      "adminUser.name as createdByName",
      "adminUser.email as createdByEmail"
    )
    .first();

  if (!quote) {
    return null;
  }

  return {
    id: quote.id,
    title: quote.title,
    createdAt: quote.createdAt,
    organisationName: quote.organisationName,
    organisationId: quote.organisationId,
    organisationLogoFileExtension: quote.organisationLogoFileExtension,
    organisationLogoDarkBackground:
      quote.organisationLogoDarkBackground ?? false,
    status: quote.status,
    pitchPersonalMessage: quote.pitchPersonalMessage,
    generatedPitchIntroduction: quote.generatedPitchIntroduction,
    generatedPitch: quote.generatedPitch,
    partner: {
      name: quote.partnerName,
      colour: quote.partnerColour,
      domain: quote.partnerDomain,
    },
    createdBy:
      quote.createdByName || quote.createdByEmail
        ? {
            name: quote.createdByName,
            email: quote.createdByEmail,
          }
        : null,
  };
};

export default getPitchForPublic;
