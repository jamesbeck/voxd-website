"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetChatUserTableData = async ({
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
  const base = db("user")
    .leftJoin("organisationUser", "user.id", "organisationUser.userId")
    .leftJoin(
      "organisation",
      "organisationUser.organisationId",
      "organisation.id"
    )
    .groupBy("user.id")
    .where((qb) => {
      if (search) {
        qb.where("user.name", "ilike", `%${search}%`).orWhere(
          "user.number",
          "ilike",
          `%${search}%`
        );
      }
    });

  //filter by organisationId if provided
  if (organisationId) {
    base.where("organisationUser.organisationId", organisationId);
  }

  //if organisation is logged in, restrict to their organisation
  if (accessToken?.organisation && !accessToken.admin) {
    base.where("organisationUser.userId", accessToken!.userId);
  }

  //if partner is logged in, restrict to their organisations
  if (accessToken?.partner) {
    base.where("organisation.partnerId", accessToken!.partnerId);
  }

  //count query
  const countQuery = base.clone().select("user.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // now select and query what we want for the data and apply pagination
  const dataQuery = base
    .clone()
    .select("user.id", "user.name", "user.number", "user.email")
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

export default saGetChatUserTableData;
