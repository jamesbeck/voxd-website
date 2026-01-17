import db from "../database/db";

const getAgentById = async ({ agentId }: { agentId: string }) => {
  const agent = await db("agent")
    .leftJoin("model", "agent.modelId", "model.id")
    .leftJoin("provider", "model.providerId", "provider.id")
    .leftJoin("phoneNumber", "agent.phoneNumberId", "phoneNumber.id")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .where("agent.id", agentId)
    .select(
      "agent.*",
      "model.model",
      "provider.name as provider",
      "model.inputTokenCost",
      "model.outputTokenCost",
      "phoneNumber.displayPhoneNumber",
      "phoneNumber.displayPhoneNumber as phoneNumber",
      "organisation.name as organisationName"
    )
    .first();
  return agent;
};

export default getAgentById;
