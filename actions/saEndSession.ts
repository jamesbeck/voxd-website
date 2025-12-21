"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saEndSession = async ({
  sessionId,
}: {
  sessionId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    const updated = await db("session")
      .where("id", sessionId)
      .whereNull("closedAt")
      .update({
        closedAt: new Date(),
        closedReason: "manually closed in Voxd portal",
      });

    if (updated === 0) {
      return {
        success: false,
        error: "Session not found or already closed",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error ending session:", error);
    return {
      success: false,
      error: "Failed to end session",
    };
  }
};

export default saEndSession;
