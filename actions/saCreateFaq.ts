"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreateFaq = async ({
  question,
  answer,
  partnersOnly,
  categoryId,
}: {
  question: string;
  answer: string;
  partnersOnly: boolean;
  categoryId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can create FAQs
  if (!accessToken.superAdmin) {
    return { success: false, error: "Only super admins can create FAQs" };
  }

  const newFaq = await db("faq")
    .insert({
      question,
      answer,
      partnersOnly,
      categoryId,
    })
    .returning("*");

  return { success: true, data: newFaq[0] };
};

export default saCreateFaq;
