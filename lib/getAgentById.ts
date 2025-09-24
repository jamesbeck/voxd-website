import db from "../database/db";

const getAgentById = async ({ agentId }: { agentId: string }) => {
  const agent = await db("agent").where("id", agentId).first();
  return agent;
};

export default getAgentById;
