import { unstable_cache } from "next/cache";
import db from "@/database/db";
import { Partner } from "@/types/types";
import { getEffectivePartnerBrandingMap } from "@/lib/getEffectivePartnerBranding";

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
        db.raw('organisation."primaryColour" as "organisationPrimaryColour"'),
        db.raw(
          'organisation."logoFileExtension" as "organisationLogoFileExtension"',
        ),
        db.raw(
          'organisation."showLogoOnColour" as "organisationShowLogoOnColour"',
        ),
      )
      .orderBy("organisation.name", "asc");

    const effectiveBrandingMap = await getEffectivePartnerBrandingMap({
      partnerIds: partners.map((partner) => partner.id),
    });

    return partners.map((partner) => {
      const effectiveBranding = effectiveBrandingMap[partner.id];

      return {
        ...partner,
        effectivePartnerName: effectiveBranding?.name ?? null,
        effectivePartnerDomain: effectiveBranding?.domain ?? null,
        effectivePartnerOrganisationId:
          effectiveBranding?.sourceOrganisationId ?? null,
        effectivePartnerPrimaryColour: effectiveBranding?.primaryColour ?? null,
        effectivePartnerLogoFileExtension:
          effectiveBranding?.logoFileExtension ?? null,
        effectivePartnerShowLogoOnColour:
          effectiveBranding?.showLogoOnColour ?? null,
        effectivePartnerLegalName: effectiveBranding?.legalName ?? null,
        effectivePartnerCompanyNumber: effectiveBranding?.companyNumber ?? null,
        effectivePartnerRegisteredAddress:
          effectiveBranding?.registeredAddress ?? null,
        effectivePartnerLegalEmail: effectiveBranding?.legalEmail ?? null,
      };
    });
  },
  ["partners"],
  { revalidate: 60, tags: ["partners"] },
);

export default getPartners;
