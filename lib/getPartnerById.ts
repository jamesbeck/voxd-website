import db from "../database/db";
import { Partner } from "@/types/types";

export const getPartnerById = async ({
  partnerId,
}: {
  partnerId: string;
}): Promise<Partner | null> => {
  const partner = await db("partner")
    .leftJoin("organisation", "partner.organisationId", "organisation.id")
    .leftJoin("providerApiKey", "partner.providerApiKeyId", "providerApiKey.id")
    .leftJoin("provider", "providerApiKey.providerId", "provider.id")
    .select(
      "partner.*",
      "organisation.primaryColour as organisationPrimaryColour",
      "organisation.logoFileExtension as organisationLogoFileExtension",
      db.raw(
        'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
      ),
      db.raw(
        `CASE WHEN "providerApiKey"."id" IS NOT NULL THEN "provider"."name" || ' — ' || LEFT("providerApiKey"."key", 6) || '...' || RIGHT("providerApiKey"."key", 4) ELSE NULL END as "providerApiKeyLabel"`,
      ),
    )
    .where("partner.id", partnerId)
    .first();

  return partner;
};

export default getPartnerById;
