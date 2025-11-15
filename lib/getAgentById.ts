import db from "../database/db";

const getAgentById = async ({ agentId }: { agentId: string }) => {
  const agent = await db("agent")
    .leftJoin("model", "agent.modelId", "model.id")
    .where("agent.id", agentId)
    .select("agent.*", "model.model", "model.provider")
    .first();
  return agent;
};

export default getAgentById;
