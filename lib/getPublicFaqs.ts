import db from "@/database/db";

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: Date;
};

export type FaqCategory = {
  id: string;
  name: string;
  count: number;
};

export async function getPublicFaqs(): Promise<PublicFaq[]> {
  const faqs = await db("faq")
    .select(
      "faq.id",
      "faq.question",
      "faq.answer",
      "faq.categoryId",
      "faq.createdAt"
    )
    .select("faqCategory.name as categoryName")
    .leftJoin("faqCategory", "faq.categoryId", "faqCategory.id")
    .where("faq.partnersOnly", false)
    .orderBy("faqCategory.name", "asc")
    .orderBy("faq.question", "asc");

  return faqs;
}

export async function getPublicFaqCategories(): Promise<FaqCategory[]> {
  const categories = await db("faqCategory")
    .select("faqCategory.id", "faqCategory.name")
    .count("faq.id as count")
    .leftJoin("faq", function () {
      this.on("faq.categoryId", "=", "faqCategory.id").andOn(
        "faq.partnersOnly",
        "=",
        db.raw("false")
      );
    })
    .groupBy("faqCategory.id", "faqCategory.name")
    .havingRaw("count(faq.id) > 0")
    .orderBy("faqCategory.name", "asc");

  return categories.map((c) => ({
    id: String(c.id),
    name: String(c.name),
    count: parseInt(c.count as string, 10),
  }));
}
