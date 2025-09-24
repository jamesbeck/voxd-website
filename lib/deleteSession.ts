"use server";

import db from "../database/db";

const deleteSession = async ({ sessionId }: { sessionId: string }) => {
  //delete the session
  await db("userMessage").delete().where({ sessionId });
  await db("assistantMessage").delete().where({ sessionId });
  await db("workerRun").delete().where({ sessionId });
  await db("session").delete().where({ id: sessionId });

  return { success: true };
};

export default deleteSession;
