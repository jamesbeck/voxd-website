import db from "../database/db";

export type PublicPitchConversation = {
  id: string;
  description: string;
  startTime: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    time: number;
    annotation: string | null;
  }[];
};

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
  exampleConversations: PublicPitchConversation[];
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

  // Get example conversations for this quote
  // Order by "order" field first (nulls last), then by id for consistent ordering
  const conversations = await db("exampleConversation")
    .where("quoteId", quoteId)
    .select("id", "description", "startTime", "messages")
    .orderByRaw('"order" IS NULL, "order" ASC, id ASC');

  // Parse the messages JSON for each conversation
  const parsedConversations = conversations.map((conv) => ({
    id: conv.id,
    description: conv.description,
    startTime: conv.startTime,
    messages: (typeof conv.messages === "string"
      ? JSON.parse(conv.messages)
      : conv.messages
    ).map(
      (m: {
        role: string;
        content: string;
        time: number;
        annotation?: string | null;
      }) => ({
        role: m.role,
        content: m.content,
        time: m.time,
        annotation: m.annotation || null,
      })
    ),
  }));

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
    exampleConversations: parsedConversations,
  };
};

export default getPitchForPublic;
