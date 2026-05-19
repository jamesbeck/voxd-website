import db from "@/database/db";
import { Knex } from "knex";

export type EffectivePartnerBranding = {
  sourceOrganisationId: string;
  sourcePartnerId: string;
  name: string;
  domain: string | null;
  legalName: string | null;
  companyNumber: string | null;
  registeredAddress: string | null;
  legalEmail: string | null;
  primaryColour: string;
  logoFileExtension: string;
  showLogoOnColour: string | null;
};

type EffectivePartnerBrandingRow = EffectivePartnerBranding & {
  rootPartnerId: string;
};

export async function getEffectivePartnerBrandingMap({
  partnerIds,
  trx = db,
}: {
  partnerIds: string[];
  trx?: Knex | Knex.Transaction;
}): Promise<Record<string, EffectivePartnerBranding>> {
  if (partnerIds.length === 0) {
    return {};
  }

  const rows = await trx
    .withRecursive("partnerBrandLineage", (queryBuilder) => {
      queryBuilder
        .select(
          trx.raw('"organisation"."id" as "rootPartnerId"'),
          "organisation.id",
          "organisation.partnerId",
          trx.raw("0 as depth"),
          trx.raw('ARRAY["organisation"."id"] as "path"'),
          "organisation.name",
          "organisation.domain",
          "organisation.legalName",
          "organisation.companyNumber",
          "organisation.registeredAddress",
          "organisation.legalEmail",
          "organisation.primaryColour",
          "organisation.logoFileExtension",
          trx.raw('"organisation"."showLogoOnColour" as "showLogoOnColour"'),
        )
        .from("organisation")
        .whereIn("organisation.id", partnerIds)
        .where("organisation.partner", true)
        .unionAll(function unionAncestorPartners() {
          this.select(
            "partnerBrandLineage.rootPartnerId",
            "parentPartner.id",
            "parentPartner.partnerId",
            trx.raw('"partnerBrandLineage"."depth" + 1'),
            trx.raw(
              'array_append("partnerBrandLineage"."path", "parentPartner"."id")',
            ),
            "parentPartner.name",
            "parentPartner.domain",
            "parentPartner.legalName",
            "parentPartner.companyNumber",
            "parentPartner.registeredAddress",
            "parentPartner.legalEmail",
            "parentPartner.primaryColour",
            "parentPartner.logoFileExtension",
            trx.raw('"parentPartner"."showLogoOnColour" as "showLogoOnColour"'),
          )
            .from({ parentPartner: "organisation" })
            .innerJoin(
              "partnerBrandLineage",
              "partnerBrandLineage.partnerId",
              "parentPartner.id",
            )
            .where("parentPartner.partner", true)
            .whereRaw(
              'NOT ("parentPartner"."id" = ANY("partnerBrandLineage"."path"))',
            );
        });
    })
    .from("partnerBrandLineage")
    .select(
      trx.raw('distinct on ("rootPartnerId") "rootPartnerId"'),
      trx.raw('id as "sourceOrganisationId"'),
      trx.raw('id as "sourcePartnerId"'),
      "name",
      "domain",
      "legalName",
      "companyNumber",
      "registeredAddress",
      "legalEmail",
      trx.raw('"primaryColour"'),
      trx.raw('"logoFileExtension"'),
      trx.raw('"showLogoOnColour"'),
    )
    .whereNotNull("primaryColour")
    .whereNotNull("logoFileExtension")
    .orderBy("rootPartnerId", "asc")
    .orderBy("depth", "asc");

  return (rows as EffectivePartnerBrandingRow[]).reduce<
    Record<string, EffectivePartnerBranding>
  >((accumulator, row) => {
    accumulator[row.rootPartnerId] = {
      sourceOrganisationId: row.sourceOrganisationId,
      sourcePartnerId: row.sourcePartnerId,
      name: row.name,
      domain: row.domain,
      legalName: row.legalName,
      companyNumber: row.companyNumber,
      registeredAddress: row.registeredAddress,
      legalEmail: row.legalEmail,
      primaryColour: row.primaryColour,
      logoFileExtension: row.logoFileExtension,
      showLogoOnColour: row.showLogoOnColour,
    };
    return accumulator;
  }, {});
}

export async function getEffectivePartnerBranding({
  partnerId,
  trx = db,
}: {
  partnerId: string | null | undefined;
  trx?: Knex | Knex.Transaction;
}): Promise<EffectivePartnerBranding | null> {
  if (!partnerId) {
    return null;
  }

  const brandingMap = await getEffectivePartnerBrandingMap({
    partnerIds: [partnerId],
    trx,
  });

  return brandingMap[partnerId] ?? null;
}
