"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import { applyOrganisationReadScope } from "@/lib/organisationAccess";

const saGetOrganisationTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  partnerId,
  ownerId,
}: ServerActionReadParams & {
  partnerId?: string;
  ownerId?: string;
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
  });

  // Allow superAdmins to filter by a specific partnerId
  if (accessToken?.superAdmin && partnerId) {
    base.where("organisation.partnerId", partnerId);
  }

  if (ownerId) {
    base.where("organisation.ownerId", ownerId);
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
