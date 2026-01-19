"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetFeatureTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can view features
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to view features.",
    };
  }

  const base = db("feature").where((qb) => {
    if (search) {
      qb.where("feature.title", "ilike", `%${search}%`).orWhere(
        "feature.slug",
        "ilike",
        `%${search}%`,
      );
    }
  });

  //count query
  const countQuery = base.clone().select("feature.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const features = await base
    .clone()
    .select("feature.*")
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: features,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetFeatureTableData;
