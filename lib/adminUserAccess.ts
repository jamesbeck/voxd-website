import { Knex } from "knex";
import db from "@/database/db";
import { AccessTokenPayload } from "@/types/tokenTypes";

const applyAdminUserScope = (
  query: Knex.QueryBuilder,
  accessToken: AccessTokenPayload,
) => {
  if (accessToken.superAdmin) {
    return query;
  }

  if (accessToken.partner) {
    query.where((qb) => {
      if (accessToken.partnerId) {
        qb.where("organisation.partnerId", accessToken.partnerId);
      }

      if (accessToken.organisationId) {
        if (accessToken.partnerId) {
          qb.orWhere("adminUser.organisationId", accessToken.organisationId);
        } else {
          qb.where("adminUser.organisationId", accessToken.organisationId);
        }
      }
    });

    return query;
  }

  return query.where("adminUser.organisationId", accessToken.organisationId);
};

const getAccessibleOrganisationForAdminUsers = async ({
  organisationId,
  accessToken,
}: {
  organisationId: string;
  accessToken: AccessTokenPayload;
}) => {
  const query = db("organisation")
    .select("organisation.id", "organisation.partnerId")
    .where("organisation.id", organisationId);

  if (accessToken.superAdmin) {
    return query.first();
  }

  if (accessToken.partner) {
    query.where((qb) => {
      if (accessToken.partnerId) {
        qb.where("organisation.partnerId", accessToken.partnerId);
      }

      if (accessToken.organisationId) {
        if (accessToken.partnerId) {
          qb.orWhere("organisation.id", accessToken.organisationId);
        } else {
          qb.where("organisation.id", accessToken.organisationId);
        }
      }
    });

    return query.first();
  }

  return query.where("organisation.id", accessToken.organisationId).first();
};

export { applyAdminUserScope, getAccessibleOrganisationForAdminUsers };