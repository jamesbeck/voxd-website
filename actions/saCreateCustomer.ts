"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saCreateCustomer = async ({
  name,
  userIds,
}: {
  name: string;
  userIds: string[];
}): Promise<ServerActionResponse> => {
  //check customer name is unique
  const existingCustomer = await db("customer")
    .select("*")
    .whereRaw("LOWER(name) = ?", name.toLowerCase())
    .first();

  if (existingCustomer) {
    return { success: false, fieldErrors: { name: "Customer already exists" } };
  }

  //create a new customer
  const [newCustomer] = await db("customer").insert({ name }).returning("id");

  //create user_customer associations
  if (userIds && userIds.length > 0) {
    const userCustomerAssociations = userIds.map((userId) => ({
      userId: userId,
      customerId: newCustomer.id,
    }));

    await db("customerUser").insert(userCustomerAssociations);
  }

  return { success: true, data: newCustomer };
};

export { saCreateCustomer };
