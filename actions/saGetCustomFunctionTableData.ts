"use server";

import db from "@/database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const sortColumns: Record<string, string> = {
  key: '"customFunction"."key"',
  agentName: '"agent"."niceName"',
  updatedAt: '"customFunction"."updatedAt"',
  enabled: '"customFunction"."enabled"',
  allowManualRun: '"customFunction"."allowManualRun"',
  allowApiRun: '"customFunction"."allowApiRun"',
  supportsScheduling: '"customFunction"."supportsScheduling"',
  nextScheduledRunAt: '"customFunction"."nextScheduledRunAt"',
};

const saGetCustomFunctionTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "label",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Unauthorized: Super admin access required",
    };
  }

  const base = db("customFunction")
    .join("agent", "customFunction.agentId", "agent.id")
    .whereNull("customFunction.archivedAt")
    .where((qb) => {
      if (search) {
        qb.where("customFunction.key", "ilike", `%${search}%`)
          .orWhere("customFunction.name", "ilike", `%${search}%`)
          .orWhere("customFunction.displayName", "ilike", `%${search}%`)
          .orWhere("customFunction.niceName", "ilike", `%${search}%`)
          .orWhere("agent.niceName", "ilike", `%${search}%`);
      }
    });

  const countQuery = base.clone().select("customFunction.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult
    ? Number.parseInt(countResult.count, 10)
    : 0;

  const customFunctions = base
    .clone()
    .select(
      "customFunction.id",
      "customFunction.agentId",
      "customFunction.key",
      "customFunction.name",
      "customFunction.displayName",
      "customFunction.niceName",
      "customFunction.targetScopes",
      "customFunction.enabled",
      "customFunction.allowManualRun",
      "customFunction.allowApiRun",
      "customFunction.supportsScheduling",
      "customFunction.nextScheduledRunAt",
      "customFunction.updatedAt",
      "agent.niceName as agentName",
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  if (sortField === "label") {
    customFunctions.orderByRaw(
      `COALESCE("customFunction"."displayName", "customFunction"."niceName", "customFunction"."name") ${sortDirection} NULLS LAST`,
    );
  } else if (sortField === "targetScopes") {
    customFunctions.orderByRaw(
      `array_to_string("customFunction"."targetScopes", ', ') ${sortDirection} NULLS LAST`,
    );
  } else {
    customFunctions.orderByRaw(
      `${sortColumns[sortField] || sortColumns.updatedAt} ${sortDirection} NULLS LAST`,
    );
  }

  return {
    success: true,
    data: await customFunctions,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetCustomFunctionTableData;
