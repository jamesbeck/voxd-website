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
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("organisation")
    .leftJoin("agent", "organisation.id", "agent.organisationId")
    .leftJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .groupBy("organisation.id")
    .where((qb) => {
      if (search) {
        qb.where("organisation.name", "ilike", `%${search}%`);
      }
    });

  //if organisation user is logged in, restrict to their organisations only
  if (!accessToken.admin && !accessToken.partner) {
    base.whereExists(function () {
      this.select("*")
        .from("organisationUser as ou")
        .whereRaw('"ou"."organisationId" = "organisation"."id"')
        .where("ou.adminUserId", accessToken!.adminUserId);
    });
  }

  //if partner is logged in, restrict to their organisations
  if (accessToken?.partner && !accessToken.admin) {
    base.where("organisation.partnerId", accessToken!.partnerId);
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
      db.raw('COUNT(DISTINCT "organisationUser"."id")::int as "userCount"'),
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
