"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetOrganisationTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  partnerId,
}: ServerActionReadParams & {
  partnerId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("organisation")
    .leftJoin("agent", "organisation.id", "agent.organisationId")
    .leftJoin("adminUser", "organisation.id", "adminUser.organisationId")
    .groupBy("organisation.id")
    .where((qb) => {
      if (search) {
        qb.where("organisation.name", "ilike", `%${search}%`);
      }
    });

  //if organisation user is logged in, restrict to their organisations only
  if (!accessToken.superAdmin && !accessToken.partner) {
    base.whereExists(function () {
      this.select("*")
        .from("adminUser as au")
        .whereRaw('"au"."organisationId" = "organisation"."id"')
        .where("au.id", accessToken!.adminUserId);
    });
  }

  //if partner is logged in (not super admin), restrict to their organisations
  if (accessToken?.partner && !accessToken.superAdmin) {
    base.where("organisation.partnerId", accessToken!.partnerId);
  }

  // Allow superAdmins to filter by a specific partnerId
  if (accessToken?.superAdmin && partnerId) {
    base.where("organisation.partnerId", partnerId);
  }

  //count query
  const countQuery = base.clone().select("organisation.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const organisations = await base
    .clone()
    .select("organisation.*")
    .select([db.raw('COUNT(DISTINCT "agent"."id")::int as "agentCount"')])
    .select([
      db.raw('COUNT(DISTINCT "adminUser"."id")::int as "adminUserCount"'),
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
