import db from "@/database/db";
import { hasAdminUserPermission } from "@/lib/adminUserPermissions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { AccessTokenPayload } from "@/types/tokenTypes";
import { Knex } from "knex";

export const canAdminUserReadAllQuotes = async ({
  accessToken,
  trx = db,
}: {
  accessToken: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}) => {
  if (accessToken.superAdmin) {
    return true;
  }

  if (!accessToken.partner) {
    return false;
  }

  return hasAdminUserPermission({
    adminUserId: accessToken.adminUserId,
    permissionKey: "read_all_quotes",
    trx,
  });
};

export const applyQuoteReadScope = async ({
  query,
  accessToken,
  trx = db,
}: {
  query: Knex.QueryBuilder;
  accessToken: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}) => {
  if (accessToken.superAdmin) {
    return query;
  }

  if (!accessToken.partner) {
    return query.whereRaw("1 = 0");
  }

  query.where("organisation.partnerId", accessToken.partnerId);

  const canReadAllQuotes = await canAdminUserReadAllQuotes({
    accessToken,
    trx,
  });

  if (!canReadAllQuotes) {
    query.where("quote.createdByAdminUserId", accessToken.adminUserId);
  }

  return query;
};

const userCanViewQuote = async ({
  quoteId,
  accessToken,
  trx = db,
}: {
  quoteId: string;
  accessToken?: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}): Promise<boolean> => {
  const resolvedAccessToken = accessToken ?? (await verifyAccessToken());

  if (resolvedAccessToken.superAdmin) {
    return true;
  }

  if (!resolvedAccessToken.partner) {
    return false;
  }

  const query = trx("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .where("quote.id", quoteId);

  await applyQuoteReadScope({
    query,
    accessToken: resolvedAccessToken,
    trx,
  });

  const quote = await query.select("quote.id").first();

  return !!quote;
};

export default userCanViewQuote;
