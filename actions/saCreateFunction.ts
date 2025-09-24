"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import slugify from "slugify";

const saCreateFunction = async ({
  name,
}: {
  name: string;
}): Promise<ServerActionResponse> => {
  const newFunction = await db("function")
    .insert({ name, slug: slugify(name, { lower: true, strict: true }) })
    .returning("*");

  return { success: true, data: newFunction };
};

export default saCreateFunction;
