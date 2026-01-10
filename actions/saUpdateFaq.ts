"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateFaq = async ({
  faqId,
  question,
  answer,
  partnersOnly,
  categoryId,
}: {
  faqId: string;
  question?: string;
  answer?: string;
  partnersOnly?: boolean;
  categoryId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can update FAQs
  if (!accessToken.superAdmin) {
    return { success: false, error: "Only super admins can update FAQs" };
  }

  if (!faqId) {
    return { success: false, error: "FAQ ID is required" };
  }

  const existingFaq = await db("faq").select("*").where({ id: faqId }).first();

  if (!existingFaq) {
    return { success: false, error: "FAQ not found" };
  }

  await db("faq").where({ id: faqId }).update({
    question,
    answer,
    partnersOnly,
    categoryId,
    updatedAt: db.fn.now(),
  });

  return { success: true };
};

export default saUpdateFaq;
