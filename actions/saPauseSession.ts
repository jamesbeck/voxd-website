"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";

const saPauseSession = async ({
  sessionId,
}: {
  sessionId: string;
}): Promise<ServerActionResponse> => {
  try {
    await db("session").update({ paused: true }).where({ id: sessionId });
  } catch (error) {
    return { success: false, error: "Error pausing session" };
  }

  return { success: true };
};

export default saPauseSession;
