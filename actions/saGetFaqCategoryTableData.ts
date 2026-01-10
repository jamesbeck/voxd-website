"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetFaqCategoryTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "name",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can access FAQ categories management
  if (!accessToken.superAdmin) {
    return { success: false, error: "Access denied" };
  }

  const base = db("faqCategory")
    .leftJoin("faq", "faq.categoryId", "faqCategory.id")
    .groupBy("faqCategory.id")
    .where((qb) => {
      if (search) {
        qb.where("faqCategory.name", "ilike", `%${search}%`);
      }
    });

  // Count query
  const countQuery = base.clone().select("faqCategory.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const categories = await base
    .clone()
    .select("faqCategory.*")
    .select(db.raw('COUNT("faq"."id")::int as "faqCount"'))
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: categories,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetFaqCategoryTableData;
