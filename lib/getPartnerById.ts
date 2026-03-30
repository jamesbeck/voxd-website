import db from "../database/db";
import { Partner } from "@/types/types";

export const getPartnerById = async ({
  partnerId,
}: {
  partnerId: string;
}): Promise<Partner | null> => {
  const partner = await db("partner")
    .leftJoin("organisation", "partner.organisationId", "organisation.id")
    .select(
      "partner.*",
      "organisation.primaryColour as organisationPrimaryColour",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      db.raw(
        'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
      ),
    )
    .where("partner.id", partnerId)
    .first();

  return partner;
};

export default getPartnerById;
