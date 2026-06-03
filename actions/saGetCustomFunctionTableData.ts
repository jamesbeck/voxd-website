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
  scheduleCron: '"customFunction"."scheduleCron"',
  nextScheduledRunAt: '"customFunction"."nextScheduledRunAt"',
  totalRuns: '"runStats"."totalRuns"',
  avgRunDurationMs: '"recentRunStats"."avgRunDurationMs"',
  successRate: '"recentRunStats"."successRate"',
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

  const runStats = db("customFunctionRun")
    .select("customFunctionId")
    .count<{ totalRuns: string }>("id as totalRuns")
    .whereNotNull("customFunctionId")
    .groupBy("customFunctionId")
    .as("runStats");

  const recentRunStats = db
    .with(
      "rankedCustomFunctionRuns",
      db("customFunctionRun")
        .select(
          "customFunctionId",
          "runResult",
          "durationMs",
          db.raw(
            'row_number() over (partition by "customFunctionId" order by "createdAt" desc) as "rowNumber"',
          ),
        )
        .whereNotNull("customFunctionId"),
    )
    .from("rankedCustomFunctionRuns")
    .select("customFunctionId")
    .select(
      db.raw(
        'avg("durationMs") filter (where "durationMs" is not null) as "avgRunDurationMs"',
      ),
    )
    .select(
      db.raw(
        '100.0 * count(*) filter (where "runResult" = ?) / nullif(count(*), 0) as "successRate"',
        ["success"],
      ),
    )
    .where("rowNumber", "<=", 100)
    .groupBy("customFunctionId")
    .as("recentRunStats");

  const customFunctions = base
    .clone()
    .leftJoin(runStats, "runStats.customFunctionId", "customFunction.id")
    .leftJoin(
      recentRunStats,
      "recentRunStats.customFunctionId",
      "customFunction.id",
    )
    .select(
      "customFunction.id",
      "customFunction.agentId",
      "customFunction.key",
      "customFunction.name",
      "customFunction.niceName",
      "customFunction.targetScopes",
      "customFunction.enabled",
      "customFunction.allowManualRun",
      "customFunction.allowApiRun",
      "customFunction.scheduleCron",
      "customFunction.nextScheduledRunAt",
      "customFunction.updatedAt",
      db.raw('coalesce("runStats"."totalRuns", 0) as "totalRuns"'),
      db.raw('"recentRunStats"."avgRunDurationMs" as "avgRunDurationMs"'),
      db.raw('"recentRunStats"."successRate" as "successRate"'),
      "agent.niceName as agentName",
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  if (sortField === "label") {
    customFunctions.orderByRaw(
      `COALESCE("customFunction"."niceName", "customFunction"."name") ${sortDirection} NULLS LAST`,
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
    data: (await customFunctions).map((customFunction) => ({
      ...customFunction,
      totalRuns:
        customFunction.totalRuns == null ? 0 : Number(customFunction.totalRuns),
      avgRunDurationMs:
        customFunction.avgRunDurationMs == null
          ? null
          : Number(customFunction.avgRunDurationMs),
      successRate:
        customFunction.successRate == null
          ? null
          : Number(customFunction.successRate),
    })),
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetCustomFunctionTableData;
