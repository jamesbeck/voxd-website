import db from "../database/db";

const getSessions = async ({ userId }: { userId: string }) => {
  const sessions = await db("session")
    .join("user", "session.userId", "user.id")
    .join("userMessage", "session.id", "userMessage.sessionId")
    .where("session.userId", userId)
    .groupBy("session.id", "user.id")
    .select(
      "session.id",
      "user.id as userId",
      "user.name",
      "user.number",
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('MIN("userMessage"."createdAt") as "firstMessageAt"')
    );

  return sessions;
};

export default getSessions;
