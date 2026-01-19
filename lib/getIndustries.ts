import db from "../database/db";

const getIndustries = async (partnerId?: string) => {
  //get industries with count of examples
  let query = db("industry").leftJoin(
    "exampleIndustry",
    "exampleIndustry.industryId",
    "industry.id",
  );

  // If partnerId is provided, join with example table and filter
  if (partnerId) {
    query = query
      .leftJoin("example", "example.id", "exampleIndustry.exampleId")
      .where(function () {
        this.where("example.partnerId", partnerId).orWhereNull("example.id");
      });
  }

  const industries = await query
    .select(
      "industry.id",
      "industry.name",
      "industry.slug",
      db.raw("count(??.id) as ??", ["exampleIndustry", "exampleCount"]),
    )
    .groupBy("industry.id")
    .orderBy("industry.name", "asc");

  return industries;
};

export default getIndustries;
