"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetDocumentTableData = async ({
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

  const base = db("knowledgeDocument")
    .where("agentId", agentId)
    .where((qb) => {
      if (search) {
        qb.where("title", "ilike", `%${search}%`).orWhere(
          "description",
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

  const documents = await base
    .clone()
    .select(
      "knowledgeDocument.id",
      "knowledgeDocument.title",
      "knowledgeDocument.description",
      "knowledgeDocument.sourceUrl",
      "knowledgeDocument.sourceType",
      "knowledgeDocument.enabled",
      "knowledgeDocument.createdAt",
      "knowledgeDocument.updatedAt"
    )
    .select(
      db.raw(
        '(SELECT COUNT(*) FROM "knowledgeBlock" WHERE "knowledgeBlock"."documentId" = "knowledgeDocument"."id")::int as "blockCount"'
      )
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: documents,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetDocumentTableData;
