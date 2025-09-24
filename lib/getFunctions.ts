import { Function } from "@/types/types";
import db from "../database/db";

const getFunctions = async (): Promise<Function[]> => {
  //get industries with count of examples
  const industries = db("function")
    .leftJoin("exampleFunction", "exampleFunction.functionId", "function.id")
    .select(
      "function.id",
      "function.name",
      "function.slug",
      db.raw("count(??.id) as ??", ["exampleFunction", "functionCount"])
    )
    .groupBy("function.id")
    .orderBy("function.name", "asc");

  return industries;
};

export default getFunctions;
