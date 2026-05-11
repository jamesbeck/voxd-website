import db from "@/database/db";
import { hasAdminUserPermission } from "@/lib/adminUserPermissions";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { AccessTokenPayload } from "@/types/tokenTypes";
import { TableFilterOption } from "@/types/types";
import { Knex } from "knex";

export const getPartnerTreeIdsSubquery = ({
  rootPartnerId,
  trx,
}: {
  rootPartnerId: string;
  trx: Knex | Knex.Transaction;
}) => {
  return trx.raw(
    `
      WITH RECURSIVE "partnerTree" AS (
        SELECT "organisation"."id"
        FROM "organisation"
        WHERE "organisation"."id" = ?
          AND "organisation"."partner" = true

        UNION

        SELECT "childOrganisation"."id"
        FROM "organisation" as "childOrganisation"
        INNER JOIN "partnerTree"
          ON "childOrganisation"."partnerId" = "partnerTree"."id"
        WHERE "childOrganisation"."partner" = true
      )
      SELECT "partnerTree"."id"
      FROM "partnerTree"
    `,
    [rootPartnerId],
  );
};

export const applyPartnerBranchScope = ({
  query,
  rootPartnerId,
  trx = db,
}: {
  query: Knex.QueryBuilder;
  rootPartnerId: string;
  trx?: Knex | Knex.Transaction;
}) => {
  return query.whereIn(
    "organisation.partnerId",
    getPartnerTreeIdsSubquery({ rootPartnerId, trx }),
  );
};

export const getAccessiblePartnerFilterOptions = async ({
  accessToken,
  trx = db,
}: {
  accessToken: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
}): Promise<TableFilterOption[]> => {
  if (accessToken.superAdmin) {
    const partners = await trx("organisation")
      .select("id", "name")
      .where("partner", true)
      .orderBy("name", "asc");

    return partners.map((partner) => ({
      label: partner.name,
      value: partner.id,
    }));
  }

  if (!accessToken.partnerId) {
    return [];
  }

  const partners = await trx("organisation")
    .select("organisation.id", "organisation.name")
    .whereIn(
      "organisation.id",
      getPartnerTreeIdsSubquery({
        rootPartnerId: accessToken.partnerId,
        trx,
      }),
    )
    .orderByRaw('CASE WHEN "organisation"."id" = ? THEN 0 ELSE 1 END', [
      accessToken.partnerId,
    ])
    .orderBy("organisation.name", "asc");

  return partners.map((partner) => ({
    label: partner.name,
    value: partner.id,
  }));
};

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
  includeRootPartnerOrganisation = false,
}: {
  query: Knex.QueryBuilder;
  accessToken: AccessTokenPayload;
  trx?: Knex | Knex.Transaction;
  includeRootPartnerOrganisation?: boolean;
}) => {
  if (accessToken.superAdmin) {
    return query;
  }

  if (accessToken.partner) {
    query.where((partnerScope) => {
      applyPartnerBranchScope({
        query: partnerScope,
        rootPartnerId: accessToken.partnerId!,
        trx,
      });

      if (includeRootPartnerOrganisation && accessToken.partnerId) {
        partnerScope.orWhere("organisation.id", accessToken.partnerId);
      }
    });

    const canReadAllOrganisations = await canAdminUserReadAllOrganisations({
      accessToken,
      trx,
    });

    if (!canReadAllOrganisations) {
      if (includeRootPartnerOrganisation && accessToken.partnerId) {
        query.where((ownerScope) => {
          ownerScope
            .where("organisation.id", accessToken.partnerId)
            .orWhere("organisation.ownerId", accessToken.adminUserId);
        });
      } else {
        query.where("organisation.ownerId", accessToken.adminUserId);
      }
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
