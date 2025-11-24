"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetAdminUserTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
  organisationId,
}: ServerActionReadParams & {
  organisationId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  //base query
  const base = db("adminUser")
    .leftJoin(
      "organisationUser",
      "adminUser.id",
      "organisationUser.adminUserId"
    )
    .leftJoin(
      "organisation",
      "organisationUser.organisationId",
      "organisation.id"
    )
    .groupBy("adminUser.id")
    .where((qb) => {
      if (search) {
        qb.where("adminUser.name", "ilike", `%${search}%`).orWhere(
          "adminUser.email",
          "ilike",
          `%${search}%`
        );
      }
    });

  //filter by organisationId if provided
  if (organisationId) {
    base.where("organisationUser.organisationId", organisationId);
  }

  //if organisation is logged in, restrict to their organisations
  if (!accessToken.partner && !accessToken.admin) {
    base.whereIn(
      "organisationUser.organisationId",
      db("organisationUser")
        .select("organisationId")
        .where("adminUserId", accessToken!.adminUserId)
    );
  }

  //if partner is logged in and not admin, restrict to their organisations
  if (accessToken?.partner && !accessToken.admin) {
    base.where("organisation.partnerId", accessToken!.partnerId);
  }

  //count query
  const countQuery = base.clone().select("adminUser.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // now select and query what we want for the data and apply pagination
  const dataQuery = base
    .clone()
    .select("adminUser.id", "adminUser.name", "adminUser.email")
    .select([
      db.raw(`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', "organisation"."id",
              'name', "organisation"."name"
            )
          ) FILTER (WHERE "organisation"."id" IS NOT NULL),
          '[]'
        ) as organisations
      `),
    ])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const users = await dataQuery;

  return {
    success: true,
    data: users,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetAdminUserTableData;
