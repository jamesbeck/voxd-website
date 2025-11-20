"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";

const saDeleteSession = async ({
  sessionId,
}: {
  sessionId: string;
}): Promise<ServerActionResponse> => {
  //delete the session
  try {
    await db.transaction(async (trx) => {
      await trx("userMessage").delete().where({ sessionId });
      await trx("assistantMessage").delete().where({ sessionId });
      await trx("workerRun").delete().where({ sessionId });
      await trx("session").delete().where({ id: sessionId });
    });
  } catch (error) {
    return { success: false, error: "Error deleting session and related data" };
  }

  return { success: true };
};

export default saDeleteSession;
