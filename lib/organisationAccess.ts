import db from "@/database/db";
import { hasAdminUserPermission } from "@/lib/adminUserPermissions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { AccessTokenPayload } from "@/types/tokenTypes";
import { Knex } from "knex";

export const canAdminUserReadAllOrganisations = async ({
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
    permissionKey: "read_all_organisations",
    trx,
  });
};

export const applyOrganisationReadScope = async ({
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

  if (accessToken.partner) {
    query.where("organisation.partnerId", accessToken.partnerId);

    const canReadAllOrganisations = await canAdminUserReadAllOrganisations({
      accessToken,
      trx,
    });

    if (!canReadAllOrganisations) {
      query.where("organisation.ownerId", accessToken.adminUserId);
    }

    return query;
  }

  return query.whereExists(function whereMemberOfOrganisation() {
    this.select("*")
      .from("adminUser as au")
      .whereRaw('"au"."organisationId" = "organisation"."id"')
      .where("au.id", accessToken.adminUserId);
  });
};

const userCanViewOrganisation = async ({
  organisationId,
  accessToken,
  trx = db,
}: {
  organisationId: string;
  accessToken?: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}): Promise<boolean> => {
  const resolvedAccessToken = accessToken ?? (await verifyAccessToken());

  if (resolvedAccessToken.superAdmin) {
    return true;
  }

  const query = trx("organisation").where("organisation.id", organisationId);

  await applyOrganisationReadScope({
    query,
    accessToken: resolvedAccessToken,
    trx,
  });

  const organisation = await query.select("organisation.id").first();

  return !!organisation;
};

export default userCanViewOrganisation;