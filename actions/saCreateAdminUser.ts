"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreateAdminUser = async ({
  name,
  email,
  partnerId,
  organisationId,
}: {
  name: string;
  email?: string;
  partnerId?: string;
  organisationId?: string;
}): Promise<ServerActionResponse> => {
  //check user number and email is unique
  const existingUser = await db("adminUser")
    .select("*")
    .orWhere(function () {
      this.where("email", email).whereNotNull("email").where("email", "!=", "");
    })
    .first();

  if (existingUser) {
    return {
      success: false,
      error: "User already exists with email",
    };
  }

  //create a new user
  const [newAdminUser] = await db("adminUser")
    .insert({
      name,
      email: email?.toLowerCase(),
      partnerId: partnerId || null,
      organisationId: organisationId || null,
    })
    .returning("id");

  return { success: true, data: newAdminUser };
};

export { saCreateAdminUser };
