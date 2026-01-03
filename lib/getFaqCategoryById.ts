import db from "@/database/db";

export default async function getFaqCategoryById(id: string) {
  const category = await db("faqCategory").select("*").where({ id }).first();

  return category;
}
