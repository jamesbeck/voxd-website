"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetFileTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const base = db("file")
    .join("userMessage", "file.userMessageId", "userMessage.id")
    .join("session", "session.id", "userMessage.sessionId")
    .leftJoin("chatUser", "session.userId", "chatUser.id")
    .leftJoin("agent", "chatUser.agentId", "agent.id")
    .where((qb) => {
      if (search) {
        qb.where("file.originalFilename", "ilike", `%${search}%`);
      }
    });

  // Count query
  const countQuery = base.clone().select("file.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const files = await base
    .clone()
    .select(
      "file.id",
      "file.thumbWasabiUrl",
      "file.wasabiUrl",
      "file.originalFilename",
      "file.type",
      "file.mimeType",
      "file.createdAt",
      "file.fileSize",
      "file.summary",
      "agent.niceName as agentName",
      "agent.id as agentId",
      "chatUser.name as chatUserName",
      "chatUser.id as chatUserId",
    )
    .select(db.raw('"userMessage"."sessionId" as "sessionId"'))
    .orderByRaw(
      `"${sortField}" ${sortDirection === "desc" ? "DESC" : "ASC"} NULLS LAST`,
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: files,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetFileTableData;
