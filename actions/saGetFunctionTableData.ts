"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetFunctionTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams & {
  customerId?: string;
}): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("function")
    .leftJoin("exampleFunction", "exampleFunction.functionId", "function.id")
    .groupBy("function.id")
    .where((qb) => {
      if (search) {
        qb.where("function.title", "ilike", `%${search}%`);
      }
    });

  //count query
  const countQuery = base.clone().select("function.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const functions = await base
    .clone()
    .select("function.*")
    .select(db.raw('COUNT("exampleFunction"."id")::int as "exampleCount"'))
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: functions,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetFunctionTableData;
