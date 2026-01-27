import { Example } from "@/types/types";
import db from "../database/db";
import { Knex } from "knex";

const query = (db: Knex) =>
  db("example")
    .select("example.*")
    .leftJoin(
      db.raw(`(
      SELECT ei."exampleId",
             jsonb_agg(to_jsonb(i) ORDER BY i.id) AS industries
      FROM "exampleIndustry" ei
      JOIN "industry" i ON i.id = ei."industryId"
      GROUP BY ei."exampleId"
    ) i`),
      "i.exampleId",
      "example.id",
    )
    .leftJoin(
      db.raw(`(
      SELECT ef."exampleId",
             jsonb_agg(to_jsonb(f) ORDER BY f.id) AS functions
      FROM "exampleFunction" ef
      JOIN "function" f ON f.id = ef."functionId"
      GROUP BY ef."exampleId"
    ) f`),
      "f.exampleId",
      "example.id",
    )
    .select(db.raw(`COALESCE(i.industries, '[]') as industries`))
    .select(db.raw(`COALESCE(f.functions,  '[]') as functions`));

export const getCaseStudiesByPartnerId = async (
  partnerId: string,
): Promise<Example[]> => {
  const examples = await query(db).where("example.partnerId", partnerId);

  return examples;
};

export default getCaseStudiesByPartnerId;
