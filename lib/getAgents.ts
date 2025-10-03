import db from "../database/db";

const getAgents = async () => {
  return db("agent")
    .leftJoin("session", "agent.id", "session.agentId")
    .leftJoin("userMessage", "session.id", "userMessage.sessionId")
    .select("agent.*")
    .select(
      db.raw('COUNT("userMessage"."id")::int as "messageCount"'),
      db.raw('MAX("userMessage"."createdAt") as "lastMessageAt"'),
      db.raw('COUNT(DISTINCT "session"."id")::int as "sessionCount"')
    )
    .groupBy("agent.id");
};

export default getAgents;
