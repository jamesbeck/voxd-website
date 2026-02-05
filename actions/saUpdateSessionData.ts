"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";

const saUpdateSessionData = async ({
  sessionId,
  data,
}: {
  sessionId: string;
  data: any;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin)
    return {
      success: false,
      error: "You do not have permission to update session data.",
    };

  if (!sessionId) {
    return {
      success: false,
      error: "Session ID is required",
    };
  }

  // Find the existing session
  const existingSession = await db("session")
    .select("*")
    .where({ id: sessionId })
    .first();

  if (!existingSession) {
    return {
      success: false,
      error: "Session not found",
    };
  }

  // Update the session data
  await db("session").where({ id: sessionId }).update({
    data,
  });

  // Log the action
  await addLog({
    event: "session.update_data",
    description: `Updated data for session ${sessionId}`,
    adminUserId: accessToken.adminUserId,
    sessionId: sessionId,
  });

  return { success: true };
};

export { saUpdateSessionData };
