import { unstable_cache } from "next/cache";
import db from "@/database/db";
import { Partner } from "@/types/types";

const getPartners = unstable_cache(
  async (): Promise<Partner[]> => {
    const partners = await db("partner")
      .leftJoin("organisation", "partner.organisationId", "organisation.id")
      .select(
        "partner.*",
        "organisation.primaryColour as organisationPrimaryColour",
        "organisation.logoFileExtension as organisationLogoFileExtension",
        db.raw(
          'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
        ),
      );
    return partners.map(
      ({
        providerApiKeyId,
        colour,
        logoFileExtension,
        showLogoOnColour,
        ...rest
      }: any) => rest,
    );
  },
  ["partners"],
  { revalidate: 60, tags: ["partners"] },
);

export default getPartners;
