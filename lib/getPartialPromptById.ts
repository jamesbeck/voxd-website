import db from "../database/db";

const getPartialPromptById = async ({
  partialPromptId,
}: {
  partialPromptId: string;
}) => {
  const partialPrompt = await db("partialPrompt")
    .leftJoin("agent", "partialPrompt.agentId", "agent.id")
    .where("partialPrompt.id", partialPromptId)
    .select(
      "partialPrompt.*",
      "agent.name as agentName",
      "agent.niceName as agentNiceName"
    )
    .first();
  return partialPrompt;
};

export default getPartialPromptById;
