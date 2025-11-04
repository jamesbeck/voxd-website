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
    .leftJoin("customer", "agent.customerId", "customer.id")
    .leftJoin("customerUser", "customer.id", "customerUser.customerId")
    .where("customerUser.userId", token.userId)
    .andWhere("agent.id", agentId)
    .select("agent.id");
  return agents.length > 0;
};

export default userCanViewAgent;
