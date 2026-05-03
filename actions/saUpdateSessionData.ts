"use server";

import { verifyAccessToken } from "@/lib/auth/verifyToken";
import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";
import { validateAgentConfig } from "@/lib/validateAgentConfig";
import { buildJsonDelta } from "@/lib/buildJsonDelta";

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
    .leftJoin("chatUser", "session.userId", "chatUser.id")
    .leftJoin("agent", "chatUser.agentId", "agent.id")
    .select("session.*", "agent.sessionDataSchema")
    .where("session.id", sessionId)
    .first();

  if (!existingSession) {
    return {
      success: false,
      error: "Session not found",
    };
  }

  const validationResult = validateAgentConfig({
    schema: existingSession.sessionDataSchema,
    config: data,
  });

  if (!validationResult.valid) {
    return {
      success: false,
      error: validationResult.error,
      fieldErrors: validationResult.fieldErrors,
    };
  }

  // Update the session data
  await db("session").where({ id: sessionId }).update({
    data,
  });

  const previousData = existingSession.data ?? null;
  const nextData = data ?? null;

  // Log the action
  await addLog({
    event: "Session Data Updated",
    description: `Updated data for session ${sessionId}`,
    adminUserId: accessToken.adminUserId,
    sessionId: sessionId,
    data: {
      before: previousData,
      after: nextData,
      delta: buildJsonDelta(previousData, nextData),
    },
  });

  return { success: true };
};

export { saUpdateSessionData };
