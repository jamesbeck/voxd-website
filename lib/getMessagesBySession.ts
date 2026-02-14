import db from "../database/db";

const getMessages = async ({ sessionId }: { sessionId: string }) => {
  const userMessages = await db("userMessage")
    .where({ sessionId })
    .orderBy("createdAt", "asc");

  // Fetch files for user messages
  const files = await db("file")
    .select(
      "id",
      "userMessageId",
      "type",
      "mimeType",
      "originalFilename",
      "wasabiUrl",
      "fileSize",
      "width",
      "height",
    )
    .whereIn(
      "userMessageId",
      userMessages.map((m) => m.id),
    );

  const userMessagesWithRole = userMessages.map((m) => ({
    ...m,
    role: "user",
    files: files.filter((f) => f.userMessageId === m.id),
  }));

  const assistantMessages = await db("assistantMessage")
    .leftJoin("model", "assistantMessage.modelId", "model.id")
    .select("assistantMessage.*", "model.model as model")
    .where({ sessionId })
    .orderBy("createdAt", "asc");

  const toolCalls = await db("toolCall").whereIn(
    "assistantMessageId",
    assistantMessages.map((m) => m.id),
  );

  const toolCallLogs = await db("toolCallLog").whereIn(
    "toolCallId",
    toolCalls.map((tc) => tc.id),
  );

  const assistantFiles = await db("file")
    .select(
      "id",
      "assistantMessageId",
      "type",
      "mimeType",
      "originalFilename",
      "wasabiUrl",
      "fileSize",
      "width",
      "height",
    )
    .whereIn(
      "assistantMessageId",
      assistantMessages.map((m) => m.id),
    );

  const assistantMessagesWithRole = assistantMessages.map((m) => ({
    ...m,
    role: "assistant",
    files: assistantFiles.filter((f) => f.assistantMessageId === m.id),
    toolCalls: toolCalls
      .filter((tc) => tc.assistantMessageId === m.id)
      .map((tc) => ({
        ...tc,
        logs: toolCallLogs.filter((log) => log.toolCallId === tc.id),
      })),
  }));

  const manualMessages = await db("manualMessage")
    .leftJoin("adminUser", "manualMessage.adminUserId", "adminUser.id")
    .leftJoin("apiKey", "manualMessage.apiKeyId", "apiKey.id")
    .where({ sessionId })
    .select(
      "manualMessage.*",
      "adminUser.name as userName",
      "apiKey.name as apiKeyName",
    )
    .orderBy("createdAt", "asc");

  const manualFiles = await db("file")
    .select(
      "id",
      "manualMessageId",
      "type",
      "mimeType",
      "originalFilename",
      "wasabiUrl",
      "fileSize",
      "width",
      "height",
    )
    .whereIn(
      "manualMessageId",
      manualMessages.map((m) => m.id),
    );

  const manualMessagesWithRole = manualMessages.map((m) => ({
    ...m,
    role: "manual",
    files: manualFiles.filter((f) => f.manualMessageId === m.id),
  }));

  const messages = [
    ...userMessagesWithRole,
    ...assistantMessagesWithRole,
    ...manualMessagesWithRole,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return messages;
};

export default getMessages;
