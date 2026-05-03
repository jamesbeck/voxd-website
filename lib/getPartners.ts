import { unstable_cache } from "next/cache";
import db from "@/database/db";
import { Partner } from "@/types/types";

const getPartners = unstable_cache(
  async (): Promise<Partner[]> => {
    try {
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
      return partners.map((partner: any) => {
        const sanitizedPartner = { ...partner };
        delete sanitizedPartner.providerApiKeyId;
        delete sanitizedPartner.colour;
        delete sanitizedPartner.logoFileExtension;
        delete sanitizedPartner.showLogoOnColour;

        return sanitizedPartner;
      });
    } catch (error: any) {
      if (error?.code === "42P01") {
        return [];
      }

      throw error;
    }
  },
  ["partners"],
  { revalidate: 60, tags: ["partners"] },
);

export default getPartners;
