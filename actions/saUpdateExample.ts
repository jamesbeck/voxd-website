"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateExample = async ({
  id,
  title,
  short,
  body,
  industries,
  functions,
}: {
  id: string;
  title: string;
  short: string;
  body: string;
  industries: string[];
  functions: string[];
}): Promise<ServerActionResponse> => {
  await db("example").where("id", id).update({ title, short, body });

  console.log("adding", industries.length, "industries");

  await db("exampleIndustry").where("exampleId", id).delete();

  if (industries.length > 0) {
    await db("exampleIndustry")
      .insert(
        industries.map((industryId) => ({
          exampleId: id,
          industryId: industryId,
        }))
      )
      .returning("*");
  }

  console.log("adding", functions.length, "functions");

  await db("exampleFunction").where("exampleId", id).delete();

  if (functions.length > 0) {
    await db("exampleFunction")
      .insert(
        functions.map((funcId) => ({
          exampleId: id,
          functionId: funcId,
        }))
      )
      .returning("*");
  }

  return { success: true };
};

export default saUpdateExample;
