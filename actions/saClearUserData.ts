"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";

const saClearUserData = async ({
  userId,
}: {
  userId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin)
    return {
      success: false,
      error: "You do not have permission to clear user data.",
    };

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
    };
  }

  // Find the existing chatUser
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

  // Update the chatUser data field to an empty object
  await db("chatUser")
    .where({ id: userId })
    .update({
      data: JSON.stringify({}),
    });

  // Log the activity
  await addLog({
    adminUserId: accessToken.adminUserId,
    chatUserId: userId,
    event: "USER_DATA_CLEARED",
    description: `User data cleared for ${existingUser.name} (${existingUser.number})`,
  });

  return { success: true };
};

export default saClearUserData;
