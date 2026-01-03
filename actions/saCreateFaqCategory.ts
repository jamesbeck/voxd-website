"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saCreateFaqCategory = async ({
  name,
}: {
  name: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only admins can create FAQ categories
  if (!accessToken.admin) {
    return { success: false, error: "Only admins can create FAQ categories" };
  }

  if (!name || name.trim() === "") {
    return { success: false, error: "Name is required" };
  }

  const newCategory = await db("faqCategory")
    .insert({
      name: name.trim(),
    })
    .returning("*");

  return { success: true, data: newCategory[0] };
};

export default saCreateFaqCategory;
