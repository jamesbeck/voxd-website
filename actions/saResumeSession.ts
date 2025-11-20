"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";

const saResumeSession = async ({
  sessionId,
}: {
  sessionId: string;
}): Promise<ServerActionResponse> => {
  try {
    await db("session").update({ paused: false }).where({ id: sessionId });
  } catch (error) {
    return { success: false, error: "Error resuming session" };
  }

  return { success: true };
};

export default saResumeSession;
