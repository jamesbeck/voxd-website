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
      "example.id"
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
      "example.id"
    )
    .leftJoin(
      db.raw(`(
      SELECT ec."exampleId",
             jsonb_agg(to_jsonb(ec) ORDER BY ec.id) AS "exampleConversations"
      FROM "exampleConversation" ec
      GROUP BY ec."exampleId"
    ) ec`),
      "ec.exampleId",
      "example.id"
    )

    .select(db.raw(`COALESCE(i.industries, '[]') as industries`))
    .select(db.raw(`COALESCE(f.functions,  '[]') as functions`))
    .select(
      db.raw(
        `COALESCE(ec."exampleConversations",  '[]') as "exampleConversations"`
      )
    );

export const getExamples = async (): Promise<Example[]> => {
  const examples = await query(db);

  return examples;
};

export const getExampleById = async (id: string): Promise<Example> => {
  const example = await query(db).where("example.id", id).first();

  console.log(example);

  return example;
};

export const getExampleBySlug = async (slug: string): Promise<Example> => {
  const example = await query(db).where("example.slug", slug).first();

  console.log(example);

  return example;
};

export const getExamplesByIndustryOrFunction = async ({
  industrySlug,
  functionSlug,
}: {
  industrySlug?: string;
  functionSlug?: string;
}): Promise<Example[]> => {
  const searchQuery = query(db);

  if (industrySlug) {
    searchQuery.whereExists(function () {
      this.select(1)
        .from("exampleIndustry as ei")
        .join("industry as i", "i.id", "ei.industryId")
        .whereRaw('ei."exampleId" = example.id')
        .andWhere("i.slug", industrySlug);
    });
  }

  if (functionSlug) {
    searchQuery.whereExists(function () {
      this.select(1)
        .from("exampleFunction as ef")
        .join("function as f", "f.id", "ef.functionId")
        .whereRaw('ef."exampleId" = example.id')
        .andWhere("f.slug", functionSlug);
    });
  }

  return await searchQuery;
};
