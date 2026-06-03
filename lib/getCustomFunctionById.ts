import db from "@/database/db";

const getCustomFunctionById = async ({
  customFunctionId,
}: {
  customFunctionId: string;
}) => {
  return db("customFunction")
    .join("agent", "customFunction.agentId", "agent.id")
    .select(
      "customFunction.id",
      "customFunction.agentId",
      "customFunction.key",
      "customFunction.name",
      "customFunction.niceName",
      "customFunction.description",
      "customFunction.targetScopes",
      "customFunction.enabled",
      "customFunction.allowManualRun",
      "customFunction.allowApiRun",
      "customFunction.scheduleCron",
      "customFunction.nextScheduledRunAt",
      "customFunction.updatedAt",
      "agent.niceName as agentName",
    )
    .where("customFunction.id", customFunctionId)
    .whereNull("customFunction.archivedAt")
    .first();
};

export default getCustomFunctionById;
