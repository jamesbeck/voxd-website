import db from "../database/db";
import { Partner } from "@/types/types";

export const getPartnerByDomain = async ({
  domain,
}: {
  domain: string;
}): Promise<Partner | null> => {
  const partner = await db("partner")
    .select("partner.*")
    .where("partner.domain", domain)
    .first();

  return partner;
};

export default getPartnerByDomain;
