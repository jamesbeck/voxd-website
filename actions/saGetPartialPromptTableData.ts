"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetPartialPromptTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
  agentId,
}: ServerActionReadParams<{
  agentId: string;
}>): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("partialPrompt")
    .where("agentId", agentId)
    .where((qb) => {
      if (search) {
        qb.where("name", "ilike", `%${search}%`).orWhere(
          "text",
          "ilike",
          `%${search}%`
        );
      }
    });

  // Count query
  const countResult = await base.clone().count("id as count").first();
  const totalAvailable = countResult
    ? parseInt(countResult.count as string)
    : 0;

  const partialPrompts = await base
    .clone()
    .select(
      "partialPrompt.id",
      "partialPrompt.name",
      "partialPrompt.text",
      "partialPrompt.createdAt",
      "partialPrompt.updatedAt"
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: partialPrompts,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetPartialPromptTableData;
