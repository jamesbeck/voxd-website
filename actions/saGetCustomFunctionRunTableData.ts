"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const sortColumns: Record<string, string> = {
  createdAt: '"customFunctionRun"."createdAt"',
  agentName: '"agent"."niceName"',
  customFunctionName: '"customFunctionRun"."customFunctionName"',
  targetScope: '"customFunctionRun"."targetScope"',
  runStatus: '"customFunctionRun"."runStatus"',
  triggerSource: '"customFunctionRun"."triggerSource"',
  durationMs: '"customFunctionRun"."durationMs"',
};

const saGetCustomFunctionRunTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Unauthorized: Super admin access required",
    };
  }

  const base = db("customFunctionRun")
    .join("agent", "customFunctionRun.agentId", "agent.id")
    .leftJoin(
      "chatUser as targetChatUser",
      "customFunctionRun.targetChatUserId",
      "targetChatUser.id",
    )
    .where((qb) => {
      if (search) {
        qb.where("customFunctionRun.id", "ilike", `%${search}%`)
          .orWhere(
            "customFunctionRun.customFunctionKey",
            "ilike",
            `%${search}%`,
          )
          .orWhere(
            "customFunctionRun.customFunctionName",
            "ilike",
            `%${search}%`,
          )
          .orWhere("agent.niceName", "ilike", `%${search}%`)
          .orWhere("targetChatUser.name", "ilike", `%${search}%`)
          .orWhere("customFunctionRun.targetSessionId", "ilike", `%${search}%`);
      }
    });

  const countQuery = base.clone().select("customFunctionRun.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult
    ? Number.parseInt(countResult.count, 10)
    : 0;

  const runs = await base
    .clone()
    .select(
      "customFunctionRun.id",
      "customFunctionRun.createdAt",
      "customFunctionRun.customFunctionKey",
      "customFunctionRun.customFunctionName",
      "customFunctionRun.targetScope",
      "customFunctionRun.targetChatUserId",
      "customFunctionRun.targetSessionId",
      "customFunctionRun.triggerSource",
      "customFunctionRun.runStatus",
      "customFunctionRun.runResult",
      "customFunctionRun.durationMs",
      "customFunctionRun.errorMessage",
      "agent.niceName as agentName",
      "targetChatUser.name as targetChatUserName",
    )
    .orderByRaw(
      `${sortColumns[sortField] || sortColumns.createdAt} ${sortDirection} NULLS LAST`,
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: runs.map((run) => ({
      ...run,
      hasError: Boolean(run.errorMessage) || run.runStatus === "failed",
    })),
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetCustomFunctionRunTableData;
