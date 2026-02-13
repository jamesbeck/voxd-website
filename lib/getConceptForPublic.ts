import db from "../database/db";

export type PublicConceptConversation = {
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

export type PublicConcept = {
  id: string;
  title: string;
  createdAt: string;
  shortLinkId: string;
  organisationName: string;
  organisationId: string;
  organisationLogoFileExtension: string | null;
  organisationLogoDarkBackground: boolean;
  status: string;
  conceptPersonalMessage: string | null;
  generatedConceptIntroduction: string | null;
  generatedConcept: string | null;
  conceptHideSections: string[] | null;
  heroImageFileExtension: string | null;
  setupFee: number | null;
  monthlyFee: number | null;
  freeMonthlyMinutes: number | null;
  partnerId: string;
  partner: {
    name: string;
    colour: string | null;
    domain: string | null;
    logoFileExtension: string | null;
  };
  salesBot: {
    name: string;
    phoneNumber: string;
  } | null;
  createdBy: {
    name: string | null;
    email: string | null;
  } | null;
  exampleConversations: PublicConceptConversation[];
};

export const getConceptForPublic = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<PublicConcept | null> => {
  // Determine if quoteId is a short link (6 chars, uppercase letters and numbers) or UUID
  const isShortLink = /^[A-Z0-9]{6}$/.test(quoteId);

  const query = db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .leftJoin("adminUser", "quote.createdByAdminUserId", "adminUser.id")
    .leftJoin("agent", "partner.salesBotAgentId", "agent.id")
    .leftJoin("phoneNumber", "agent.phoneNumberId", "phoneNumber.id");

  // Look up by shortLinkId or quote.id depending on format
  if (isShortLink) {
    query.where("quote.shortLinkId", quoteId);
  } else {
    query.where("quote.id", quoteId);
  }

  const quote = await query
    .select(
      "quote.id",
      "quote.title",
      "quote.createdAt",
      "quote.shortLinkId",
      "quote.status",
      "quote.conceptPersonalMessage",
      "quote.generatedConceptIntroduction",
      "quote.generatedConcept",
      "quote.conceptHideSections",
      "quote.heroImageFileExtension",
      "quote.setupFee",
      "quote.monthlyFee",
      "quote.freeMonthlyMinutes",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      "organisation.logoDarkBackground as organisationLogoDarkBackground",
      "partner.id as partnerId",
      "partner.name as partnerName",
      "partner.colour as partnerColour",
      "partner.domain as partnerDomain",
      "partner.logoFileExtension as partnerLogoFileExtension",
      "partner.salesBotName",
      "phoneNumber.displayPhoneNumber as salesBotPhoneNumber",
      "adminUser.name as createdByName",
      "adminUser.email as createdByEmail",
    )
    .first();

  if (!quote) {
    return null;
  }

  // Get example conversations for this quote
  // Order by "order" field first (nulls last), then by id for consistent ordering
  const conversations = await db("exampleConversation")
    .where("quoteId", quote.id)
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
        imageUrl?: string;
        fileName?: string;
        fileSize?: string;
      }) => ({
        role: m.role,
        content: m.content,
        time: m.time,
        annotation: m.annotation || null,
        imageUrl: m.imageUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
      }),
    ),
  }));

  return {
    id: quote.id,
    title: quote.title,
    createdAt: quote.createdAt,
    shortLinkId: quote.shortLinkId,
    organisationName: quote.organisationName,
    organisationId: quote.organisationId,
    organisationLogoFileExtension: quote.organisationLogoFileExtension,
    organisationLogoDarkBackground:
      quote.organisationLogoDarkBackground ?? false,
    status: quote.status,
    conceptPersonalMessage: quote.conceptPersonalMessage,
    generatedConceptIntroduction: quote.generatedConceptIntroduction,
    generatedConcept: quote.generatedConcept,
    conceptHideSections: quote.conceptHideSections,
    heroImageFileExtension: quote.heroImageFileExtension,
    setupFee: quote.setupFee ?? null,
    monthlyFee: quote.monthlyFee ?? null,
    freeMonthlyMinutes: quote.freeMonthlyMinutes ?? null,
    partnerId: quote.partnerId,
    partner: {
      name: quote.partnerName,
      colour: quote.partnerColour,
      domain: quote.partnerDomain,
      logoFileExtension: quote.partnerLogoFileExtension,
    },
    salesBot:
      quote.salesBotName && quote.salesBotPhoneNumber
        ? {
            name: quote.salesBotName,
            phoneNumber: quote.salesBotPhoneNumber,
          }
        : null,
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

export default getConceptForPublic;
