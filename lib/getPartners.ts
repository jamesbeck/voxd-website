import { unstable_cache } from "next/cache";
import db from "@/database/db";
import { Partner } from "@/types/types";

const getPartners = unstable_cache(
  async (): Promise<Partner[]> => {
    const partners = await db("partner").select("*");
    return partners.map(({ openAiApiKey, ...rest }: any) => rest);
  },
  ["partners"],
  { revalidate: 60, tags: ["partners"] },
);

export default getPartners;
