import db from "../database/db";

const getFunctions = async (partnerId?: string) => {
  //get functions with count of examples
  let query = db("function").leftJoin(
    "exampleFunction",
    "exampleFunction.functionId",
    "function.id",
  );

  // If partnerId is provided, join with example table and filter
  if (partnerId) {
    query = query
      .leftJoin("example", "example.id", "exampleFunction.exampleId")
      .where(function () {
        this.where("example.partnerId", partnerId).orWhereNull("example.id");
      });
  }

  const functions = await query
    .select(
      "function.id",
      "function.name",
      "function.slug",
      db.raw("count(??.id) as ??", ["exampleFunction", "functionCount"]),
    )
    .groupBy("function.id")
    .orderBy("function.name", "asc");

  return functions;
};

export default getFunctions;
