import db from "../database/db";

const getSessionById = async ({ sessionId }: { sessionId: string }) => {
  const session = await db("session").where("id", sessionId).first();
  return session;
};

export default getSessionById;
