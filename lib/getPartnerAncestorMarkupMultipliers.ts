import db from "@/database/db";
import { Knex } from "knex";

export type PartnerAncestorMarkupMultipliers = {
  setupFeeMultiplier: number;
  monthlyFeeMultiplier: number;
  hourlyRateMultiplier: number;
};

const DEFAULT_MARKUP_MULTIPLIERS: PartnerAncestorMarkupMultipliers = {
  setupFeeMultiplier: 1,
  monthlyFeeMultiplier: 1,
  hourlyRateMultiplier: 1,
};

const getPartnerAncestorMarkupMultipliers = async ({
  partnerId,
  trx = db,
}: {
  partnerId: string | null | undefined;
  trx?: Knex | Knex.Transaction;
}): Promise<PartnerAncestorMarkupMultipliers> => {
  if (!partnerId) {
    return DEFAULT_MARKUP_MULTIPLIERS;
  }

  const result = await trx
    .withRecursive("partnerLineage", (queryBuilder) => {
      queryBuilder
        .select(
          "organisation.id",
          "organisation.partnerId",
          trx.raw("0 as depth"),
          trx.raw('ARRAY["organisation"."id"] as "path"'),
          trx.raw("1::numeric as \"setupFeeMultiplier\""),
          trx.raw("1::numeric as \"monthlyFeeMultiplier\""),
          trx.raw("1::numeric as \"hourlyRateMultiplier\""),
        )
        .from("organisation")
        .where("organisation.id", partnerId)
        .where("organisation.partner", true)
        .unionAll(function unionAncestorPartners() {
          this.select(
            "parentPartner.id",
            "parentPartner.partnerId",
            trx.raw('"partnerLineage"."depth" + 1'),
            trx.raw(
              'array_append("partnerLineage"."path", "parentPartner"."id")',
            ),
            trx.raw(
              '"partnerLineage"."setupFeeMultiplier" * COALESCE("parentPartner"."defaultSubPartnerMarkupSetupFee", 1)',
            ),
            trx.raw(
              '"partnerLineage"."monthlyFeeMultiplier" * COALESCE("parentPartner"."defaultSubPartnerMarkupMonthlyFee", 1)',
            ),
            trx.raw(
              '"partnerLineage"."hourlyRateMultiplier" * COALESCE("parentPartner"."defaultSubPartnerMarkupHourlyRate", 1)',
            ),
          )
            .from({ parentPartner: "organisation" })
            .innerJoin(
              "partnerLineage",
              "partnerLineage.partnerId",
              "parentPartner.id",
            )
            .where("parentPartner.partner", true)
            .whereRaw(
              'NOT ("parentPartner"."id" = ANY("partnerLineage"."path"))',
            );
        });
    })
    .from("partnerLineage")
    .select(
      trx.raw(
        'COALESCE("partnerLineage"."setupFeeMultiplier", 1)::float as "setupFeeMultiplier"',
      ),
      trx.raw(
        'COALESCE("partnerLineage"."monthlyFeeMultiplier", 1)::float as "monthlyFeeMultiplier"',
      ),
      trx.raw(
        'COALESCE("partnerLineage"."hourlyRateMultiplier", 1)::float as "hourlyRateMultiplier"',
      ),
    )
    .orderBy("partnerLineage.depth", "desc")
    .first<PartnerAncestorMarkupMultipliers>();

  return result ?? DEFAULT_MARKUP_MULTIPLIERS;
};

export default getPartnerAncestorMarkupMultipliers;