import db from "../database/db";

const getConversations = async ({ agentId }: { agentId: string }) => {
  const conversations = await db("userMessage")
    .join("user", "userMessage.userId", "user.id")
    .where("userMessage.agentId", agentId)
    .groupBy("user.id")
    .select(
      "user.id as userId",
      "user.name",
      "user.number",
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('MIN("userMessage"."createdAt") as "firstMessageAt"')
    );

  return conversations;
};

export default getConversations;
