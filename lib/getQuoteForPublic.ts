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
  status: string;
  background: string | null;
  objectives: string | null;
  dataSources: string | null;
  integrationRequirements: string | null;
  otherNotes: string | null;
  generatedIntroduction: string | null;
  generatedSpecification: string | null;
  setupFee: number | null;
  monthlyFee: number | null;
  partner: {
    name: string;
    colour: string | null;
    domain: string | null;
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
      "quote.background",
      "quote.objectives",
      "quote.dataSources",
      "quote.integrationRequirements",
      "quote.otherNotes",
      "quote.generatedIntroduction",
      "quote.generatedSpecification",
      "quote.setupFee",
      "quote.monthlyFee",
      "organisation.name as organisationName",
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
  const conversations = await db("exampleConversation")
    .where("quoteId", quoteId)
    .select("id", "description", "startTime", "messages")
    .orderBy("id", "asc");

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
    status: quote.status,
    background: quote.background,
    objectives: quote.objectives,
    dataSources: quote.dataSources,
    integrationRequirements: quote.integrationRequirements,
    otherNotes: quote.otherNotes,
    generatedIntroduction: quote.generatedIntroduction,
    generatedSpecification: quote.generatedSpecification,
    setupFee: quote.setupFee,
    monthlyFee: quote.monthlyFee,
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

export default getQuoteForPublic;
