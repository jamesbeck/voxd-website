"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

export interface LogFilters {
  adminUserId?: string;
  apiKeyId?: string;
  organisationId?: string;
  partnerId?: string;
  sessionId?: string;
  agentId?: string;
  chatUserId?: string;
}

const saGetLogTableData = async ({
  search,
  page = 1,
  pageSize = 50,
  sortField = "createdAt",
  sortDirection = "desc",
  adminUserId,
  apiKeyId,
  organisationId,
  partnerId,
  sessionId,
  agentId,
  chatUserId,
}: ServerActionReadParams<LogFilters>): Promise<ServerActionReadResponse> => {
  await verifyAccessToken();

  const base = db("log")
    .leftJoin("adminUser", "log.adminUserId", "adminUser.id")
    .leftJoin("apiKey", "log.apiKeyId", "apiKey.id");

  // Apply filters
  if (adminUserId) base.where("log.adminUserId", adminUserId);
  if (apiKeyId) base.where("log.apiKeyId", apiKeyId);
  if (organisationId) base.where("log.organisationId", organisationId);
  if (partnerId) base.where("log.partnerId", partnerId);
  if (sessionId) base.where("log.sessionId", sessionId);
  if (agentId) base.where("log.agentId", agentId);
  if (chatUserId) base.where("log.chatUserId", chatUserId);

  if (search) {
    base.where((qb) => {
      qb.where("log.event", "ilike", `%${search}%`)
        .orWhere("log.description", "ilike", `%${search}%`)
        .orWhere("adminUser.name", "ilike", `%${search}%`)
        .orWhere("adminUser.email", "ilike", `%${search}%`)
        .orWhere("log.ipAddress", "ilike", `%${search}%`);
    });
  }

  // Count query
  const countResult = await base.clone().count("log.id as count").first();
  const totalAvailable = countResult
    ? parseInt(countResult.count as string)
    : 0;

  // Data query
  const logs = await base
    .clone()
    .select(
      "log.id",
      "log.event",
      "log.description",
      "log.data",
      "log.ipAddress",
      "log.createdAt",
      "log.adminUserId",
      "log.apiKeyId",
      "log.organisationId",
      "log.partnerId",
      "log.sessionId",
      "log.agentId",
      "log.chatUserId",
      "adminUser.name as adminUserName",
      "adminUser.email as adminUserEmail",
      "apiKey.name as apiKeyName"
    )
    .orderBy(`log.${sortField}`, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: logs,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetLogTableData;
