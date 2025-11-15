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

  const messages = [...userMessagesWithRole, ...assistantMessagesWithRole].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  return messages;
};

export default getMessages;
