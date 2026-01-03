"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saGetFaqCategories = async (): Promise<
  { id: string; name: string }[]
> => {
  await verifyAccessToken();

  const categories = await db("faqCategory")
    .select("id", "name")
    .orderBy("name", "asc");

  return categories;
};

export default saGetFaqCategories;
