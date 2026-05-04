import { unstable_cache } from "next/cache";
import db from "@/database/db";
import { Partner } from "@/types/types";

const getPartners = unstable_cache(
  async (): Promise<Partner[]> => {
    const partners = await db("organisation")
      .where("organisation.partner", true)
      .select(
        "organisation.id",
        "organisation.name",
        "organisation.domain",
        "organisation.coreDomain",
        "organisation.providerApiKeyId",
        "organisation.sendEmailFromDomain",
        "organisation.salesBotName",
        "organisation.salesBotAgentId",
        "organisation.prototypingAgentId",
        "organisation.legalName",
        "organisation.companyNumber",
        "organisation.registeredAddress",
        "organisation.legalEmail",
        "organisation.goCardlessMandateLink",
        "organisation.salesEmail",
        "organisation.accountsEmail",
        "organisation.hourlyRate",
        "organisation.monthlyBaseFee",
        "organisation.monthlyPerIntegration",
        "organisation.sendEmailFromDomainVerified",
        db.raw('organisation.id as "organisationId"'),
        db.raw(
          'organisation."primaryColour" as "organisationPrimaryColour"',
        ),
        db.raw(
          'organisation."logoFileExtension" as "organisationLogoFileExtension"',
        ),
        db.raw(
          'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
        ),
      )
      .orderBy("organisation.name", "asc");

    return partners;
  },
  ["partners"],
  { revalidate: 60, tags: ["partners"] },
);

export default getPartners;
