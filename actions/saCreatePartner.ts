"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreatePartner = async ({
  name,
}: {
  name: string;
}): Promise<ServerActionResponse> => {
  //create a new user
  const [newUser] = await db("partner").insert({ name }).returning("id");

  return { success: true, data: newUser };
};

export default saCreatePartner;
