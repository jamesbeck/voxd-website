"use server";

import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";

const saGetTemplateSendAttemptTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
  agentId,
  templateMessageSendId,
  chatUserId,
}: ServerActionReadParams & {
  agentId: string;
  templateMessageSendId?: string;
  chatUserId?: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return { success: false, error: "Unauthorized" };
  }

  // Base query: templateMessageSendAttempt joined to chatUser, scoped to agent
  const buildBaseQuery = () => {
    const subquery = db("templateMessageSendAttempt")
      .join("chatUser", "templateMessageSendAttempt.chatUserId", "chatUser.id")
      .leftJoin(
        "waTemplate",
        "templateMessageSendAttempt.templateId",
        "waTemplate.id",
      )
      .where("chatUser.agentId", agentId);

    if (chatUserId) {
      subquery.where("chatUser.id", chatUserId);
    }

    if (templateMessageSendId) {
      subquery.where(
        "templateMessageSendAttempt.templateMessageSendId",
        templateMessageSendId,
      );
    }

    return subquery;
  };

  const base = buildBaseQuery().select(
    "templateMessageSendAttempt.id",
    "templateMessageSendAttempt.templateMessageSendId",
    "templateMessageSendAttempt.success",
    "templateMessageSendAttempt.error",
    "templateMessageSendAttempt.createdAt",
    "chatUser.id as chatUserId",
    "chatUser.name as chatUserName",
    "chatUser.number as chatUserNumber",
    "chatUser.email as chatUserEmail",
    "waTemplate.name as templateName",
  );

  if (search) {
    base.where((qb) => {
      qb.where("chatUser.name", "ilike", `%${search}%`).orWhere(
        "chatUser.number",
        "ilike",
        `%${search}%`,
      );
    });
  }

  // Count query
  const countQuery = buildBaseQuery()
    .clone()
    .select("templateMessageSendAttempt.id as attemptId");

  if (search) {
    countQuery.where((qb) => {
      qb.where("chatUser.name", "ilike", `%${search}%`).orWhere(
        "chatUser.number",
        "ilike",
        `%${search}%`,
      );
    });
  }

  const countResult = await db
    .count<{ count: string }>("attemptId")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  // Data query with pagination
  const data = await base
    .clone()
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetTemplateSendAttemptTableData;
