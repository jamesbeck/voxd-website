"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateUser = async ({
  userId,
  name,
  number,
  email,
  testingAgentId,
  customerIds,
}: {
  userId: string;
  name?: string;
  number?: string;
  email?: string;
  testingAgentId?: string;
  customerIds?: string[];
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.admin)
    return {
      success: false,
      error: "You do not have permission to update users.",
    };

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
    };
  }

  //find the existing user
  const existingUser = await db("user")
    .select("*")
    .where({ id: userId })
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  //update the user
  await db("user")
    .where({ id: userId })
    .update({ name, number, email, testingAgentId });

  //update customer associations
  if (customerIds) {
    //delete existing associations
    await db("customerUser").where({ userId }).del();

    //create new associations
    if (customerIds.length > 0) {
      const userCustomerAssociations = customerIds.map((customerId) => ({
        userId: userId,
        customerId: customerId,
      }));

      await db("customerUser").insert(userCustomerAssociations);
    }
  }

  return { success: true };
};

export { saUpdateUser };
