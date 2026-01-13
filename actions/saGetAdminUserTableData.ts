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

  // Subquery for last login
  const lastLoginSubquery = db("log")
    .select("adminUserId")
    .max("createdAt as lastLogin")
    .where("event", "User Login")
    .groupBy("adminUserId")
    .as("lastLoginQuery");

  //base query
  const base = db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .leftJoin(lastLoginSubquery, "adminUser.id", "lastLoginQuery.adminUserId")
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
    base.where("adminUser.organisationId", organisationId);
  }

  //if organisation is logged in, restrict to their organisation
  if (!accessToken.partner && !accessToken.superAdmin) {
    base.where("adminUser.organisationId", accessToken.organisationId);
  }

  //if partner is logged in and not super admin, restrict to partner-level admin users only
  if (accessToken?.partner && !accessToken.superAdmin) {
    base.where("adminUser.partnerId", accessToken!.partnerId);
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
    .select(
      "adminUser.id",
      "adminUser.name",
      "adminUser.email",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "lastLoginQuery.lastLogin"
    )
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
