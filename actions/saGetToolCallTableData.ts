"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetToolCallTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "startedAt",
  sortDirection = "desc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can access tool call data
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Unauthorized: Super admin access required",
    };
  }

  const base = db("toolCall")
    .join(
      "assistantMessage",
      "toolCall.assistantMessageId",
      "assistantMessage.id",
    )
    .join("session", "assistantMessage.sessionId", "session.id")
    .join("chatUser", "session.userId", "chatUser.id")
    .join("agent", "chatUser.agentId", "agent.id")
    .where((qb) => {
      if (search) {
        qb.where("toolCall.toolName", "ilike", `%${search}%`)
          .orWhere("chatUser.name", "ilike", `%${search}%`)
          .orWhere("chatUser.number", "ilike", `%${search}%`)
          .orWhere("agent.niceName", "ilike", `%${search}%`);
      }
    });

  // Count query
  const countQuery = base.clone().select("toolCall.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const toolCalls = await base
    .clone()
    .select(
      "toolCall.id",
      "toolCall.toolName",
      "toolCall.startedAt",
      "toolCall.finishedAt",
      "toolCall.assistantMessageId",
      "chatUser.name as chatUserName",
      "chatUser.number as chatUserNumber",
      "agent.niceName as agentName",
      db.raw(`(
        "toolCall"."errorMessage" IS NOT NULL 
        OR EXISTS (
          SELECT 1 FROM "toolCallLog" 
          WHERE "toolCallLog"."toolCallId" = "toolCall"."id" 
          AND "toolCallLog"."error" = true
        )
      ) as "hasError"`),
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: toolCalls,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetToolCallTableData;
