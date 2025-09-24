"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import slugify from "slugify";

const saCreateIndustry = async ({
  name,
}: {
  name: string;
}): Promise<ServerActionResponse> => {
  const newIndustry = await db("industry")
    .insert({ name, slug: slugify(name, { lower: true, strict: true }) })
    .returning("*");

  return { success: true, data: newIndustry };
};

export default saCreateIndustry;
