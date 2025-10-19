import db from "../database/db";
import { verifyAccessToken } from "./auth/verifyToken";
import verifyAccess from "./auth/verifyAccess";

const getSessionById = async ({ sessionId }: { sessionId: string }) => {
  const accessToken = await verifyAccessToken();

  await verifyAccess({ sessionId });

  const session = await db("session").where("id", sessionId).first();

  //does this person have access to this agent?
  if (accessToken?.admin) {
    //admins have access to everything
    return session;
  }
  return session;
};

export default getSessionById;
