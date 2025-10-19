import db from "../database/db";

const getUsers = async () => {
  return db("user")
    .leftJoin("session", "user.id", "session.userId")
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select("user.*")
    .select(
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"')
    )
    .groupBy("user.id");
};

export default getUsers;
