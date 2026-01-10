import db from "../database/db";

const getUsers = async () => {
  return db("chatUser")
    .leftJoin("session", "chatUser.id", "session.userId")
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select("chatUser.*")
    .select(
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"')
    )
    .groupBy("chatUser.id");
};

export default getUsers;
