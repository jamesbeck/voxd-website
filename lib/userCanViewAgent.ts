import db from "../database/db";
import { verifyAccessToken } from "./auth/verifyToken";
import { AccessTokenPayload } from "@/types/tokenTypes";

const userCanViewAgent = async ({
  agentId,
  accessToken,
}: {
  agentId: string;
  accessToken?: AccessTokenPayload;
}): Promise<boolean> => {
  const token = accessToken ?? (await verifyAccessToken());

  if (token.superAdmin) return true;

  const query = db("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .where("agent.id", agentId);

  // Partner can view agents in their organisations or their own organisation
  if (token.partner) {
    query.where((qb) => {
      qb.where("organisation.partnerId", token.partnerId);
      if (token.organisationId) {
        qb.orWhere("agent.organisationId", token.organisationId);
      }
    });
  } else {
    // Organisation user can only view agents in their organisation
    query.where("agent.organisationId", token.organisationId);
  }

  const agents = await query.select("agent.id");
  return agents.length > 0;
};

export default userCanViewAgent;
