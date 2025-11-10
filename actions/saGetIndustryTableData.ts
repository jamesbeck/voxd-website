"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetIndustryTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams & {
  organisationId?: string;
}): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("industry")
    .leftJoin("exampleIndustry", "exampleIndustry.industryId", "industry.id")
    .groupBy("industry.id")
    .where((qb) => {
      if (search) {
        qb.where("industry.title", "ilike", `%${search}%`);
      }
    });

  //count query
  const countQuery = base.clone().select("industry.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const industries = await base
    .clone()
    .select("industry.*")
    .select(db.raw('COUNT("exampleIndustry"."id")::int as "exampleCount"'))
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: industries,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetIndustryTableData;
