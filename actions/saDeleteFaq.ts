"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteFaq = async ({
  faqId,
}: {
  faqId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can delete FAQs
  if (!accessToken.superAdmin) {
    return { success: false, error: "Only super admins can delete FAQs" };
  }

  try {
    await db("faq").delete().where({ id: faqId });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return { success: false, error: "Error deleting FAQ" };
  }

  return { success: true };
};

export default saDeleteFaq;
