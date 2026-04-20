import db from "../database/db";

const getAgentById = async ({ agentId }: { agentId: string }) => {
  const agent = await db("agent")
    .leftJoin("model", "agent.modelId", "model.id")
    .leftJoin("provider", "model.providerId", "provider.id")
    .leftJoin("phoneNumber", "agent.phoneNumberId", "phoneNumber.id")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .leftJoin("providerApiKey", "agent.providerApiKeyId", "providerApiKey.id")
    .leftJoin(
      "provider as keyProvider",
      "providerApiKey.providerId",
      "keyProvider.id",
    )
    .leftJoin(
      "organisation as keyOrganisation",
      "providerApiKey.organisationId",
      "keyOrganisation.id",
    )
    .where("agent.id", agentId)
    .select(
      "agent.*",
      "model.model",
      "provider.name as provider",
      "model.inputTokenCost",
      "model.outputTokenCost",
      "phoneNumber.displayPhoneNumber",
      "phoneNumber.displayPhoneNumber as phoneNumber",
      "organisation.name as organisationName",
      db.raw('"providerApiKey"."key" as "providerApiKey"'),
      db.raw(
        `CASE WHEN "providerApiKey"."id" IS NOT NULL THEN "keyProvider"."name" || ' — ' || LEFT("providerApiKey"."key", 6) || '...' || RIGHT("providerApiKey"."key", 4) || COALESCE(' (' || "keyOrganisation"."name" || ')', '') ELSE NULL END as "providerApiKeyLabel"`,
      ),
    )
    .first();
  return agent;
};

export default getAgentById;
