"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetKnowledgeBlockTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "blockIndex",
  sortDirection = "asc",
  documentId,
}: ServerActionReadParams<{
  documentId: string;
}>): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("knowledgeBlock")
    .where("documentId", documentId)
    .where((qb) => {
      if (search) {
        qb.where("content", "ilike", `%${search}%`).orWhere(
          "title",
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

  const blocks = await base
    .clone()
    .select(
      "knowledgeBlock.id",
      "knowledgeBlock.content",
      "knowledgeBlock.title",
      "knowledgeBlock.blockIndex",
      "knowledgeBlock.tokenCount",
      "knowledgeBlock.createdAt",
      db.raw(
        'CASE WHEN "knowledgeBlock"."embedding" IS NOT NULL THEN true ELSE false END as "hasEmbedding"'
      )
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: blocks,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetKnowledgeBlockTableData;
