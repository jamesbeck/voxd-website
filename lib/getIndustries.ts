import { Industry } from "@/types/types";
import db from "../database/db";

const getIndustries = async (): Promise<Industry[]> => {
  //get industries with count of examples
  const industries = db("industry")
    .leftJoin("exampleIndustry", "exampleIndustry.industryId", "industry.id")
    .select(
      "industry.id",
      "industry.name",
      "industry.slug",
      db.raw("count(??.id) as ??", ["exampleIndustry", "exampleCount"])
    )
    .groupBy("industry.id")
    .orderBy("industry.name", "asc");

  return industries;
};

export default getIndustries;
