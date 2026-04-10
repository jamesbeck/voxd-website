"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetProviderTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "name",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("provider").where((qb) => {
    if (search) {
      qb.where("name", "ilike", `%${search}%`);
    }
  });

  const countQuery = base.clone().select("id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();
  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const data = await base
    .clone()
    .select("id", "name")
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetProviderTableData;
