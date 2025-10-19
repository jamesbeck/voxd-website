"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreateUser = async ({
  name,
  number,
  email,
}: {
  name: string;
  number?: string;
  email?: string;
}): Promise<ServerActionResponse> => {
  //check user number and email is unique
  const existingUser = await db("user")
    .select("*")
    .where(function () {
      this.where("number", number)
        .whereNotNull("number")
        .where("number", "!=", "");
    })
    .orWhere(function () {
      this.where("email", email).whereNotNull("email").where("email", "!=", "");
    })
    .first();

  console.log({ existingUser });

  if (existingUser) {
    return {
      success: false,
      error: "User already exists with email or number",
    };
  }

  //create a new user
  const [newUser] = await db("user")
    .insert({ name, number, email })
    .returning("id");

  return { success: true, data: newUser };
};

export { saCreateUser };
