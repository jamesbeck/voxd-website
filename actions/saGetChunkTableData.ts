"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetChunkTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "chunkIndex",
  sortDirection = "asc",
  documentId,
}: ServerActionReadParams<{
  documentId: string;
}>): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("knowledgeChunk")
    .where("documentId", documentId)
    .where((qb) => {
      if (search) {
        qb.where("content", "ilike", `%${search}%`).orWhere(
          "titlePath",
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

  const chunks = await base
    .clone()
    .select(
      "knowledgeChunk.id",
      "knowledgeChunk.content",
      "knowledgeChunk.titlePath",
      "knowledgeChunk.chunkIndex",
      "knowledgeChunk.tokenCount",
      "knowledgeChunk.createdAt",
      db.raw(
        'CASE WHEN "knowledgeChunk"."embedding" IS NOT NULL THEN true ELSE false END as "hasEmbedding"'
      )
    )
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: chunks,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetChunkTableData;
