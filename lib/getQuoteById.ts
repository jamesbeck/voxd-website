import db from "../database/db";

export type Quote = {
  id: string;
  title: string;
  createdAt: string;
  organisationId: string;
  organisationName: string;
  partnerId: string;
  status: string;
  specification: string;
};

export const getQuoteById = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<Quote | null> => {
  const quote = await db<Quote>("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .where("quote.id", quoteId)
    .select("quote.*", "organisation.name as organisationName")
    .first();

  return quote;
};

export default getQuoteById;
