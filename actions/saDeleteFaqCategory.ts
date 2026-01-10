"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteFaqCategory = async ({
  categoryId,
}: {
  categoryId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can delete FAQ categories
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Only super admins can delete FAQ categories",
    };
  }

  try {
    // Check if there are any FAQs using this category
    const faqCount = await db("faq")
      .where({ categoryId })
      .count("id as count")
      .first();

    if (faqCount && parseInt(faqCount.count as string) > 0) {
      return {
        success: false,
        error: `Cannot delete category: ${faqCount.count} FAQ(s) are using this category`,
      };
    }

    await db("faqCategory").delete().where({ id: categoryId });
  } catch (error) {
    console.error("Error deleting FAQ category:", error);
    return { success: false, error: "Error deleting FAQ category" };
  }

  return { success: true };
};

export default saDeleteFaqCategory;
