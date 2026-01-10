"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetFaqTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("faq").where((qb) => {
    if (search) {
      qb.where("faq.question", "ilike", `%${search}%`).orWhere(
        "faq.answer",
        "ilike",
        `%${search}%`
      );
    }
    // Organisation users can only see non-partner-only FAQs
    if (!accessToken.superAdmin && !accessToken.partner) {
      qb.andWhere("faq.partnersOnly", false);
    }
  });

  // Count query
  const countQuery = base.clone().select("faq.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const faqs = await base
    .clone()
    .select("faq.*")
    .select("faqCategory.name as categoryName")
    .leftJoin("faqCategory", "faq.categoryId", "faqCategory.id")
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [sortField])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: faqs,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetFaqTableData;
