"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateCustomer = async ({
  customerId,
  name,
  userIds,
}: {
  customerId: string;
  name: string;
  userIds: string[];
}): Promise<ServerActionResponse> => {
  if (!customerId) {
    return {
      success: false,
      error: "Customer ID is required",
    };
  }

  //find the existing customer
  const existingCustomer = await db("customer")
    .select("*")
    .where({ id: customerId })
    .first();

  if (!existingCustomer) {
    return {
      success: false,
      error: "Customer not found",
    };
  }

  //update the customer
  await db("customer").where({ id: customerId }).update({ name });

  //update user associations
  if (userIds) {
    //delete existing associations
    await db("customerUser").where({ customerId }).del();
    //insert new associations
    const customerUserData = userIds.map((userId) => ({
      customerId,
      userId,
    }));
    await db("customerUser").insert(customerUserData);
  }

  return { success: true };
};

export { saUpdateCustomer };
