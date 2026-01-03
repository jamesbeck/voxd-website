import db from "@/database/db";

export default async function getFaqById(id: string) {
  const faq = await db("faq").select("*").where({ id }).first();

  return faq;
}
