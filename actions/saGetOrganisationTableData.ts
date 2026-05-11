"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import {
  applyOrganisationReadScope,
  applyPartnerBranchScope,
} from "@/lib/organisationAccess";

const saGetOrganisationTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  partner,
  partnerId,
  ownerId,
  includeRootPartnerOrganisation = false,
}: ServerActionReadParams & {
  partner?: boolean;
  partnerId?: string;
  ownerId?: string;
  includeRootPartnerOrganisation?: boolean;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("organisation")
    .leftJoin("adminUser as owner", "organisation.ownerId", "owner.id")
    .where((qb) => {
      if (search) {
        qb.where("organisation.name", "ilike", `%${search}%`);
      }
    });

  await applyOrganisationReadScope({
    query: base,
    accessToken,
    includeRootPartnerOrganisation,
  });

  if ((accessToken?.superAdmin || accessToken?.partner) && partnerId) {
    applyPartnerBranchScope({
      query: base,
      rootPartnerId: partnerId,
    });
  }

  if (ownerId) {
    base.where("organisation.ownerId", ownerId);
  }

  if (partner) {
    base.where("organisation.partner", true);
  }

  const countResult = await base
    .clone()
    .clearSelect()
    .clearOrder()
    .countDistinct<{ count: string }>("organisation.id as count")
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const organisations = await base
    .clone()
    .select("organisation.*")
    .select("owner.name as ownerName")
    .select([
      db.raw(`COALESCE((
        WITH RECURSIVE "partnerLineage" AS (
          SELECT
            "partnerOrganisation"."id",
            "partnerOrganisation"."name",
            "partnerOrganisation"."partnerId",
            0 as "depth",
            ARRAY["partnerOrganisation"."id"] as "path"
          FROM "organisation" as "partnerOrganisation"
          WHERE "partnerOrganisation"."id" = CASE
            WHEN "organisation"."partner" = true THEN "organisation"."id"
            ELSE "organisation"."partnerId"
          END
            AND "partnerOrganisation"."partner" = true

          UNION ALL

          SELECT
            "parentPartner"."id",
            "parentPartner"."name",
            "parentPartner"."partnerId",
            "partnerLineage"."depth" + 1,
            array_append("partnerLineage"."path", "parentPartner"."id")
          FROM "organisation" as "parentPartner"
          INNER JOIN "partnerLineage"
            ON "partnerLineage"."partnerId" = "parentPartner"."id"
          WHERE "parentPartner"."partner" = true
            AND NOT (
              "parentPartner"."id" = ANY("partnerLineage"."path")
            )
        )
        SELECT json_agg("partnerLineage"."name" ORDER BY "partnerLineage"."depth" DESC)
        FROM "partnerLineage"
      ), '[]'::json) as "partnerStructure"`),
    ])
    .select([
      db.raw(`(
        SELECT COUNT(DISTINCT "agent"."id")::int
        FROM "agent"
        WHERE "agent"."organisationId" = "organisation"."id"
      ) as "agentCount"`),
    ])
    .select([
      db.raw(`(
        SELECT COUNT(DISTINCT "adminUser"."id")::int
        FROM "adminUser"
        WHERE "adminUser"."organisationId" = "organisation"."id"
      ) as "adminUserCount"`),
    ])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: organisations,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetOrganisationTableData;
