"use server";

import db from "../database/db";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetModelTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "provider",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const base = db("model").where((qb) => {
    if (search) {
      qb.where("model.provider", "ilike", `%${search}%`).orWhere(
        "model.model",
        "ilike",
        `%${search}%`
      );
    }
  });

  //count query
  const countQuery = base.clone().select("model.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const models = await base
    .clone()
    .select("model.*")
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: models,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetModelTableData;
