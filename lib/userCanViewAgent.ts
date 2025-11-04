import db from "../database/db";

const userCanViewAgent = async ({
  userId,
  agentId,
}: {
  userId: string;
  agentId: string;
}): Promise<boolean> => {
  const agents = await db("agent")
    .leftJoin("customer", "agent.customerId", "customer.id")
    .leftJoin("customerUser", "customer.id", "customerUser.customerId")
    .where("customerUser.userId", userId)
    .andWhere("agent.id", agentId)
    .select("agent.id");
  return agents.length > 0;
};

export default userCanViewAgent;
