import db from "@/database/db";

const getCustomFunctionRunById = async ({ runId }: { runId: string }) => {
  const run = await db("customFunctionRun")
    .join("agent", "customFunctionRun.agentId", "agent.id")
    .leftJoin(
      "chatUser as targetChatUser",
      "customFunctionRun.targetChatUserId",
      "targetChatUser.id",
    )
    .select(
      "customFunctionRun.*",
      "agent.niceName as agentName",
      "targetChatUser.name as targetChatUserName",
    )
    .where("customFunctionRun.id", runId)
    .first();

  if (!run) {
    return null;
  }

  const logs = await db("customFunctionRunLog")
    .select(
      "customFunctionRunLog.id",
      "customFunctionRunLog.createdAt",
      "customFunctionRunLog.message",
      "customFunctionRunLog.data",
      "customFunctionRunLog.error",
    )
    .where("customFunctionRunLog.customFunctionRunId", runId)
    .orderBy("customFunctionRunLog.createdAt", "asc");

  return {
    ...run,
    logs,
  };
};

export default getCustomFunctionRunById;
