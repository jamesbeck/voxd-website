"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import userCanViewAgent from "@/lib/userCanViewAgent";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const saGetTemplateMessageSendTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
  agentId,
}: ServerActionReadParams & {
  agentId: string;
}): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!(await userCanViewAgent({ agentId, accessToken }))) {
    return { success: false, error: "Unauthorized" };
  }

  const applySearch = (query: ReturnType<typeof buildBaseQuery>) => {
    if (!search) {
      return query;
    }

    return query.having((qb) => {
      qb.whereRaw('coalesce("waTemplate"."name", \'\') ilike ?', [
        `%${search}%`,
      ]).orWhereRaw('coalesce("adminUser"."name", \'\') ilike ?', [
        `%${search}%`,
      ]);
    });
  };

  const buildBaseQuery = () => {
    const subquery = db("templateMessageSend")
      .join("agent", "templateMessageSend.agentId", "agent.id")
      .leftJoin("waTemplate", "templateMessageSend.templateId", "waTemplate.id")
      .leftJoin(
        "adminUser",
        "templateMessageSend.createdByAdminUserId",
        "adminUser.id",
      )
      .leftJoin(
        "templateMessageSendAttempt",
        "templateMessageSend.id",
        "templateMessageSendAttempt.templateMessageSendId",
      )
      .where("templateMessageSend.agentId", agentId)
      .groupBy(
        "templateMessageSend.id",
        "templateMessageSend.createdAt",
        "waTemplate.name",
        "adminUser.name",
      );

    return subquery;
  };

  const base = applySearch(buildBaseQuery()).select(
    "templateMessageSend.id",
    "templateMessageSend.createdAt",
    "waTemplate.name as templateName",
    "adminUser.name as createdByAdminUserName",
    db.raw('count("templateMessageSendAttempt"."id")::int as "attemptCount"'),
    db.raw(
      'sum(case when "templateMessageSendAttempt"."success" = true then 1 else 0 end)::int as "successCount"',
    ),
    db.raw(
      'sum(case when "templateMessageSendAttempt"."success" = false then 1 else 0 end)::int as "failureCount"',
    ),
  );

  const countQuery = db
    .from(
      applySearch(buildBaseQuery())
        .clone()
        .select("templateMessageSend.id")
        .as("templateSends"),
    )
    .count<{ count: string }>("id")
    .first();

  const countResult = await countQuery;
  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

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

export default saGetTemplateMessageSendTableData;
