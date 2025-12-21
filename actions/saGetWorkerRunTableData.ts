"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetWorkerRunTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "scheduledFor",
  sortDirection = "desc",
  sessionId,
}: ServerActionReadParams<{
  sessionId: string;
}>): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("workerRun").where("sessionId", sessionId);

  if (search) {
    base.where((qb) => {
      qb.where("workerName", "ilike", `%${search}%`)
        .orWhere("runStatus", "ilike", `%${search}%`)
        .orWhere("runResult", "ilike", `%${search}%`);
    });
  }

  // Count query
  const countResult = await base.clone().count("id as count").first();
  const totalAvailable = countResult
    ? parseInt(countResult.count as string)
    : 0;

  // Data query
  const workerRuns = await base
    .clone()
    .select(
      "id",
      "workerName",
      "scheduledFor",
      "startedAt",
      "completedAt",
      "runStatus",
      "runResult",
      "error",
      "createdAt"
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: workerRuns,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetWorkerRunTableData;
