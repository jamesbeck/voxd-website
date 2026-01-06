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
  totalPromptTokens: number;
  totalCompletionTokens: number;
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

  // Join to user to get agentId since sessions no longer have agentId
  const session = await db("session")
    .leftJoin("user", "session.userId", "user.id")
    .select(
      "session.*",
      "user.agentId as agentId",
      db.raw(
        '(SELECT MAX("createdAt") FROM "userMessage" WHERE "userMessage"."sessionId" = "session"."id") as "lastUserMessageDate"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."promptTokens") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS INTEGER) as "totalPromptTokens"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."completionTokens") FROM "assistantMessage" WHERE "assistantMessage"."sessionId" = "session"."id"), 0) AS INTEGER) as "totalCompletionTokens"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."promptTokens" * "model"."inputTokenCost") FROM "assistantMessage" LEFT JOIN "model" ON "assistantMessage"."modelId" = "model"."id" WHERE "assistantMessage"."sessionId" = "session"."id") / 1000000.0, 0) AS FLOAT) as "totalPromptCost"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."completionTokens" * "model"."outputTokenCost") FROM "assistantMessage" LEFT JOIN "model" ON "assistantMessage"."modelId" = "model"."id" WHERE "assistantMessage"."sessionId" = "session"."id") / 1000000.0, 0) AS FLOAT) as "totalCompletionCost"'
      ),
      db.raw(
        'CAST(COALESCE((SELECT SUM("assistantMessage"."promptTokens" * "model"."inputTokenCost" + "assistantMessage"."completionTokens" * "model"."outputTokenCost") FROM "assistantMessage" LEFT JOIN "model" ON "assistantMessage"."modelId" = "model"."id" WHERE "assistantMessage"."sessionId" = "session"."id") / 1000000.0, 0) AS FLOAT) as "totalCost"'
      )
    )
    .where("session.id", sessionId)
    .first();

  // console.log(session);

  //does this person have access to this agent?
  if (accessToken?.admin) {
    //admins have access to everything
    return session;
  }
  return session;
};

export default getSessionById;
