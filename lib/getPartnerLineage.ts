import db from "@/database/db";
import { Knex } from "knex";

export type PartnerLineageNode = {
  id: string;
  name: string;
  partnerId: string | null;
  depth: number;
};

const getPartnerLineage = async ({
  partnerId,
  trx = db,
}: {
  partnerId: string | null | undefined;
  trx?: Knex | Knex.Transaction;
}): Promise<PartnerLineageNode[]> => {
  if (!partnerId) {
    return [];
  }

  const lineage = await trx
    .withRecursive("partnerLineage", (queryBuilder) => {
      queryBuilder
        .select(
          "organisation.id",
          "organisation.name",
          "organisation.partnerId",
          trx.raw("0 as depth"),
          trx.raw('ARRAY["organisation"."id"] as "path"'),
        )
        .from("organisation")
        .where("organisation.id", partnerId)
        .where("organisation.partner", true)
        .unionAll(function unionAncestorPartners() {
          this.select(
            "parentPartner.id",
            "parentPartner.name",
            "parentPartner.partnerId",
            trx.raw('"partnerLineage"."depth" + 1'),
            trx.raw(
              'array_append("partnerLineage"."path", "parentPartner"."id")',
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
    .select("id", "name", "partnerId", "depth")
    .orderBy("depth", "asc");

  return lineage;
};

export default getPartnerLineage;
