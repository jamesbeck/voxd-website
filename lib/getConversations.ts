import db from "../database/db";

const getConversations = async ({ agentId }: { agentId: string }) => {
  const conversations = await db("userMessage")
    .join("chatUser", "userMessage.userId", "chatUser.id")
    .where("userMessage.agentId", agentId)
    .groupBy("chatUser.id")
    .select(
      "chatUser.id as userId",
      "chatUser.name",
      "chatUser.number",
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('MIN("userMessage"."createdAt") as "firstMessageAt"')
    );

  return conversations;
};

export default getConversations;
