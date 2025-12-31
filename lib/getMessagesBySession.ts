import db from "../database/db";

const getMessages = async ({ sessionId }: { sessionId: string }) => {
  const userMessages = await db("userMessage")
    .where({ sessionId })
    .orderBy("createdAt", "asc");

  const userMessagesWithRole = userMessages.map((m) => ({
    ...m,
    role: "user",
  }));

  const assistantMessages = await db("assistantMessage")
    .leftJoin("model", "assistantMessage.modelId", "model.id")
    .select("assistantMessage.*", "model.model as model")
    .where({ sessionId })
    .orderBy("createdAt", "asc");

  const toolCalls = await db("toolCall").whereIn(
    "assistantMessageId",
    assistantMessages.map((m) => m.id)
  );

  const assistantMessagesWithRole = assistantMessages.map((m) => ({
    ...m,
    role: "assistant",
    toolCalls: toolCalls.filter((tc) => tc.assistantMessageId === m.id),
  }));

  const manualMessages = await db("manualMessage")
    .leftJoin("adminUser", "manualMessage.adminUserId", "adminUser.id")
    .leftJoin("apiKey", "manualMessage.apiKeyId", "apiKey.id")
    .where({ sessionId })
    .select(
      "manualMessage.*",
      "adminUser.name as userName",
      "apiKey.name as apiKeyName"
    )
    .orderBy("createdAt", "asc");

  const manualMessagesWithRole = manualMessages.map((m) => ({
    ...m,
    role: "manual",
  }));

  const messages = [
    ...userMessagesWithRole,
    ...assistantMessagesWithRole,
    ...manualMessagesWithRole,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return messages;
};

export default getMessages;
