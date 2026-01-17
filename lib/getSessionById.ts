import db from "../database/db";
import { verifyAccessToken } from "./auth/verifyToken";

interface Session {
  id: string;
  sessionType: string;
  agentId: string;
  userId: string;
  createdAt: Date;
  closedAt: Date | null;
  closedReason: string | null;
  data: any;
  lastUserMessageDate: Date | null;
  totalinputTokens: number;
  totaloutputTokens: number;
  totalPromptCost: number;
  totalCompletionCost: number;
  totalCost: number;
  paused: boolean;
}

const getSessionById = async ({
  sessionId,
}: {
  sessionId: string;
}): Promise<Session | undefined> => {
  const accessToken = await verifyAccessToken();

  // Join to chatUser to get agentId since sessions no longer have agentId
  const query = db("session")
    .leftJoin("chatUser", "session.userId", "chatUser.id")
    .leftJoin("agent", "chatUser.agentId", "agent.id")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .select(
      "session.*",
      "chatUser.agentId as agentId",
      db.raw(
        '(SELECT MAX("createdAt") FROM "userMessage" WHERE "userMessage"."sessionId" = "session"."id") as "lastUserMessageDate"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."inputTokens") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS INTEGER) as "totalinputTokens"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."outputTokens") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS INTEGER) as "totaloutputTokens"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."inputTokens" * "model"."inputTokenCost") FROM "assistantMessage" LEFT JOIN "model" ON "assistantMessage"."modelId" = "model"."id" WHERE "assistantMessage"."sessionId" = "session"."id") / 1000000.0, 0) AS FLOAT) as "totalPromptCost"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."outputTokens" * "model"."outputTokenCost") FROM "assistantMessage" LEFT JOIN "model" ON "assistantMessage"."modelId" = "model"."id" WHERE "assistantMessage"."sessionId" = "session"."id") / 1000000.0, 0) AS FLOAT) as "totalCompletionCost"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."inputTokens" * "model"."inputTokenCost" + "assistantMessage"."outputTokens" * "model"."outputTokenCost") FROM "assistantMessage" LEFT JOIN "model" ON "assistantMessage"."modelId" = "model"."id" WHERE "assistantMessage"."sessionId" = "session"."id") / 1000000.0, 0) AS FLOAT) as "totalCost"'
      )
    )
    .where("session.id", sessionId);

  // Super admins have access to everything
  if (accessToken?.superAdmin) {
    return query.first();
  }

  // Non-super-admins cannot see development sessions
  query.where("session.sessionType", "!=", "development");

  // Partners can only see sessions from organisations they manage
  if (accessToken?.partner) {
    query.where("organisation.partnerId", accessToken.partnerId);
  } else {
    // Regular organisation users can only see sessions from their organisation
    query.where("agent.organisationId", accessToken.organisationId);
  }

  return query.first();
};

export default getSessionById;
