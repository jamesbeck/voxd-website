import db from "@/database/db";

interface UserMessage {
  id: string;
  whatsappMessageId: string;
  sessionId: string;
  responseStatus: string;
  text: string;
  createdAt: Date;
  assistantResponseId: string | null;
  error: string | null;
  role: "user";
}

interface AssistantMessage {
  id: string;
  whatsappMessageId: string;
  sessionId: string;
  systemPrompt: string | null;
  outputSessionData: Record<string, any> | null;
  outputUserData: Record<string, any> | null;
  text: string;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: Date;
  modelId: string | null;
  model: string | null;
  responseRequestedAt: Date | null;
  responseReceivedAt: Date | null;
  toolCalls: any[];
  role: "assistant";
}

interface ManualMessage {
  id: string;
  whatsappMessageId: string;
  sessionId: string;
  adminUserId: string;
  userName: string | null;
  text: string;
  createdAt: Date;
  role: "manual";
}

type Message = UserMessage | AssistantMessage | ManualMessage;

const getMessageById = async ({
  messageId,
  messageType,
}: {
  messageId: string;
  messageType: "user" | "assistant" | "manual";
}): Promise<Message | null> => {
  if (messageType === "user") {
    const message = await db("userMessage").where("id", messageId).first();
    if (!message) return null;
    return { ...message, role: "user" } as UserMessage;
  }

  if (messageType === "assistant") {
    const message = await db("assistantMessage")
      .leftJoin("model", "assistantMessage.modelId", "model.id")
      .select("assistantMessage.*", "model.model as model")
      .where("assistantMessage.id", messageId)
      .first();
    if (!message) return null;

    const toolCalls = await db("toolCall").where(
      "assistantMessageId",
      messageId
    );

    const toolCallIds = toolCalls.map((tc) => tc.id);
    const toolCallLogs =
      toolCallIds.length > 0
        ? await db("toolCallLog")
            .whereIn("toolCallId", toolCallIds)
            .orderBy("createdAt", "asc")
        : [];

    const toolCallsWithLogs = toolCalls.map((tc) => ({
      ...tc,
      logs: toolCallLogs.filter((log) => log.toolCallId === tc.id),
    }));

    return {
      ...message,
      role: "assistant",
      toolCalls: toolCallsWithLogs,
    } as AssistantMessage;
  }

  if (messageType === "manual") {
    const message = await db("manualMessage")
      .leftJoin("adminUser", "manualMessage.adminUserId", "adminUser.id")
      .select("manualMessage.*", "adminUser.name as userName")
      .where("manualMessage.id", messageId)
      .first();
    if (!message) return null;
    return { ...message, role: "manual" } as ManualMessage;
  }

  return null;
};

export default getMessageById;
