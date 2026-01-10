"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateUser = async ({
  userId,
  name,
  number,
  email,
  partnerId,
  testingAgentId,
}: {
  userId: string;
  name?: string;
  number?: string;
  email?: string;
  partnerId?: string;
  testingAgentId?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin)
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

  //find the existing chatUser
  const existingUser = await db("chatUser")
    .select("*")
    .where({ id: userId })
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  //update the chatUser
  await db("chatUser")
    .where({ id: userId })
    .update({
      name,
      number,
      email: email?.toLowerCase(),
      partnerId: partnerId || null,
      testingAgentId: testingAgentId || null,
    });

  return { success: true };
};

export { saUpdateUser };
