import db from "../database/db";
import { verifyAccessToken } from "./auth/verifyToken";

const userCanViewAgent = async ({
  agentId,
}: {
  agentId: string;
}): Promise<boolean> => {
  const token = await verifyAccessToken();

  if (token.admin) return true;

  const agents = await db("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .leftJoin(
      "organisationUser",
      "organisation.id",
      "organisationUser.organisationId"
    )
    .where("organisationUser.adminUserId", token.adminUserId)
    .orWhere("organisation.partnerId", token.partnerId)
    .andWhere("agent.id", agentId)
    .select("agent.id");
  return agents.length > 0;
};

export default userCanViewAgent;
