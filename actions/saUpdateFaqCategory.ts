"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateFaqCategory = async ({
  categoryId,
  name,
}: {
  categoryId: string;
  name?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only admins can update FAQ categories
  if (!accessToken.admin) {
    return { success: false, error: "Only admins can update FAQ categories" };
  }

  if (!categoryId) {
    return { success: false, error: "Category ID is required" };
  }

  const existingCategory = await db("faqCategory")
    .select("*")
    .where({ id: categoryId })
    .first();

  if (!existingCategory) {
    return { success: false, error: "Category not found" };
  }

  await db("faqCategory").where({ id: categoryId }).update({
    name,
    updatedAt: db.fn.now(),
  });

  return { success: true };
};

export default saUpdateFaqCategory;
