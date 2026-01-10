import db from "../database/db";

const getSessions = async ({ userId }: { userId: string }) => {
  const sessions = await db("session")
    .join("chatUser", "session.userId", "chatUser.id")
    .join("userMessage", "session.id", "userMessage.sessionId")
    .where("session.userId", userId)
    .groupBy("session.id", "chatUser.id")
    .select(
      "session.id",
      "chatUser.id as userId",
      "chatUser.name",
      "chatUser.number",
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('MIN("userMessage"."createdAt") as "firstMessageAt"')
    );

  return sessions;
};

export default getSessions;
