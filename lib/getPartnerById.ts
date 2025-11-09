import db from "../database/db";
import { Partner } from "@/types/types";

export const getPartnerById = async ({
  partnerId,
}: {
  partnerId: string;
}): Promise<Partner | null> => {
  const partner = await db("partner")
    .select("partner.*")
    .where("partner.id", partnerId)
    .first();

  return partner;
};

export default getPartnerById;
