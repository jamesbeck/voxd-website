import db from "../database/db";

export type PublicQuoteConversation = {
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

export type PublicQuote = {
  id: string;
  title: string;
  createdAt: string;
  organisationName: string;
  organisationId: string;
  organisationLogoFileExtension: string | null;
  organisationLogoDarkBackground: boolean;
  status: string;
  background: string | null;
  objectives: string | null;
  dataSourcesAndIntegrations: string | null;
  otherNotes: string | null;
  proposalPersonalMessage: string | null;
  generatedProposalIntroduction: string | null;
  generatedSpecification: string | null;
  setupFee: number | null;
  monthlyFee: number | null;
  heroImageFileExtension: string | null;
  partner: {
    name: string;
    colour: string | null;
    domain: string | null;
    logoFileExtension: string | null;
    legalName: string | null;
    companyNumber: string | null;
    registeredAddress: string | null;
    legalEmail: string | null;
  };
  createdBy: {
    name: string | null;
    email: string | null;
  } | null;
  exampleConversations: PublicQuoteConversation[];
};

export const getQuoteForPublic = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<PublicQuote | null> => {
  // Determine if quoteId is a short link (6 chars, uppercase letters and numbers) or UUID
  const isShortLink = /^[A-Z0-9]{6}$/.test(quoteId);

  const query = db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .leftJoin("adminUser", "quote.createdByAdminUserId", "adminUser.id");

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
      "quote.status",
      "quote.background",
      "quote.objectives",
      "quote.dataSourcesAndIntegrations",
      "quote.otherNotes",
      "quote.proposalPersonalMessage",
      "quote.generatedProposalIntroduction",
      "quote.generatedSpecification",
      "quote.setupFee",
      "quote.monthlyFee",
      "quote.heroImageFileExtension",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      "organisation.logoDarkBackground as organisationLogoDarkBackground",
      "partner.name as partnerName",
      "partner.colour as partnerColour",
      "partner.domain as partnerDomain",
      "partner.logoFileExtension as partnerLogoFileExtension",
      "partner.legalName as partnerLegalName",
      "partner.companyNumber as partnerCompanyNumber",
      "partner.registeredAddress as partnerRegisteredAddress",
      "partner.legalEmail as partnerLegalEmail",
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
      }) => ({
        role: m.role,
        content: m.content,
        time: m.time,
        annotation: m.annotation || null,
      }),
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
    background: quote.background,
    objectives: quote.objectives,
    dataSourcesAndIntegrations: quote.dataSourcesAndIntegrations,
    otherNotes: quote.otherNotes,
    proposalPersonalMessage: quote.proposalPersonalMessage,
    generatedProposalIntroduction: quote.generatedProposalIntroduction,
    generatedSpecification: quote.generatedSpecification,
    setupFee: quote.setupFee,
    monthlyFee: quote.monthlyFee,
    heroImageFileExtension: quote.heroImageFileExtension,
    partner: {
      name: quote.partnerName,
      colour: quote.partnerColour,
      domain: quote.partnerDomain,
      logoFileExtension: quote.partnerLogoFileExtension,
      legalName: quote.partnerLegalName,
      companyNumber: quote.partnerCompanyNumber,
      registeredAddress: quote.partnerRegisteredAddress,
      legalEmail: quote.partnerLegalEmail,
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

export default getQuoteForPublic;
