import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";

const verifyAccess = async ({ sessionId }: { sessionId?: string }) => {
  const accessToken = await verifyAccessToken();

  if (accessToken?.admin) {
    //admins have access to everything
    return true;
  }

  //verify access to the session
  if (sessionId) {
    if (accessToken?.customer) {
      const session = await db("session")
        .select("agent.customerId")
        .leftJoin("agent", "session.agentId", "agent.id")
        .where("session.id", sessionId)
        .first();

      console.log(session, accessToken);

      if (accessToken?.customerIds?.includes(session?.customerId)) {
        return true;
      }
    }
  }
  return notFound();
};

export default verifyAccess;
