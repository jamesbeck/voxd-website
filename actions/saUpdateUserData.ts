"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";
import { validateAgentConfig } from "@/lib/validateAgentConfig";

const saUpdateUserData = async ({
  userId,
  data,
}: {
  userId: string;
  data: any;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin)
    return {
      success: false,
      error: "You do not have permission to update user data.",
    };

  if (!userId) {
    return {
      success: false,
      error: "User ID is required",
    };
  }

  // Find the existing chatUser
  const existingUser = await db("chatUser")
    .leftJoin("agent", "chatUser.agentId", "agent.id")
    .select("chatUser.*", "agent.userDataSchema")
    .where("chatUser.id", userId)
    .first();

  if (!existingUser) {
    return {
      success: false,
      error: "User not found",
    };
  }

  const validationResult = validateAgentConfig({
    schema: existingUser.userDataSchema,
    config: data,
  });

  if (!validationResult.valid) {
    return {
      success: false,
      error: validationResult.error,
      fieldErrors: validationResult.fieldErrors,
    };
  }

  // Update the chatUser data
  await db("chatUser").where({ id: userId }).update({
    data,
  });

  // Log the action
  await addLog({
    event: "chatUser.update_data",
    description: `Updated data for user ${existingUser.name}`,
    adminUserId: accessToken.adminUserId,
    chatUserId: userId,
  });

  return { success: true };
};

export { saUpdateUserData };
