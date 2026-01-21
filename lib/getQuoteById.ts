import db from "../database/db";

export type QuoteConversation = {
  id: string;
  description: string;
  prompt: string;
  startTime: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    annotation: string | null;
    time: number;
  }[];
};

export type Quote = {
  id: string;
  title: string;
  createdAt: string;
  organisationId: string;
  organisationName: string;
  partnerId: string;
  status: string;
  background: string | null;
  objectives: string | null;
  dataSourcesAndIntegrations: string | null;
  otherNotes: string | null;
  setupFee: number | null;
  monthlyFee: number | null;
  setupFeeVoxdCost: number | null;
  monthlyFeeVoxdCost: number | null;
  exampleConversations: QuoteConversation[];
  createdByAdminUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  generatedPitchIntroduction: string | null;
  generatedPitch: string | null;
  pitchPersonalMessage: string | null;
  pitchHideSections: string[] | null;
  generatedProposalIntroduction: string | null;
  generatedSpecification: string | null;
  proposalPersonalMessage: string | null;
  heroImageFileExtension: string | null; // Hero image file extension for quote
};

export const getQuoteById = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<Quote | null> => {
  const quote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("adminUser", "quote.createdByAdminUserId", "adminUser.id")
    .where("quote.id", quoteId)
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "organisation.partnerId",
      "adminUser.name as ownerName",
      "adminUser.email as ownerEmail",
    )
    .first();

  if (!quote) {
    return null;
  }

  // Get example conversations for this quote
  // Order by "order" field first (nulls last), then by id for consistent ordering
  const conversations = await db("exampleConversation")
    .where("quoteId", quoteId)
    .select("id", "description", "prompt", "startTime", "messages", "order")
    .orderByRaw('"order" IS NULL, "order" ASC, id ASC');

  // Parse the messages JSON for each conversation
  const parsedConversations = conversations.map((conv) => ({
    ...conv,
    messages:
      typeof conv.messages === "string"
        ? JSON.parse(conv.messages)
        : conv.messages,
  }));

  return {
    ...quote,
    exampleConversations: parsedConversations,
  };
};

export default getQuoteById;
