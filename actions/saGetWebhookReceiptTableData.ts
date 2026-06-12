"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

type WebhookReceiptTableParams = ServerActionReadParams<{
  agentId?: string;
}>;

const SORT_FIELDS: Record<string, string> = {
  agentName: "agentWebhookReceipt.agentName",
  completedAt: "agentWebhookReceipt.completedAt",
  createdAt: "agentWebhookReceipt.createdAt",
  durationMs: "agentWebhookReceipt.durationMs",
  method: "agentWebhookReceipt.method",
  path: "agentWebhookReceipt.path",
  provider: "agentWebhookReceipt.provider",
  providerEventType: "agentWebhookReceipt.providerEventType",
  responseStatusCode: "agentWebhookReceipt.responseStatusCode",
  runStatus: "agentWebhookReceipt.runStatus",
  startedAt: "agentWebhookReceipt.startedAt",
  success: "agentWebhookReceipt.success",
  verificationStatus: "agentWebhookReceipt.verificationStatus",
  webhookKey: "agentWebhookReceipt.webhookKey",
};

const saGetWebhookReceiptTableData = async ({
  agentId,
  page = 1,
  pageSize = 100,
  search,
  sortDirection = "desc",
  sortField = "createdAt",
}: WebhookReceiptTableParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Unauthorized: Super admin access required",
    };
  }

  const resolvedSortField = SORT_FIELDS[sortField] || SORT_FIELDS.createdAt;
  const resolvedSortDirection = sortDirection === "asc" ? "asc" : "desc";

  const base = db("agentWebhookReceipt")
    .where((qb) => {
      if (agentId) {
        qb.where("agentWebhookReceipt.agentId", agentId);
      }
    })
    .where((qb) => {
      if (!search) {
        return;
      }

      qb.where("agentWebhookReceipt.agentName", "ilike", `%${search}%`)
        .orWhere("agentWebhookReceipt.webhookKey", "ilike", `%${search}%`)
        .orWhere("agentWebhookReceipt.provider", "ilike", `%${search}%`)
        .orWhere("agentWebhookReceipt.providerEventId", "ilike", `%${search}%`)
        .orWhere(
          "agentWebhookReceipt.providerEventType",
          "ilike",
          `%${search}%`,
        )
        .orWhere("agentWebhookReceipt.path", "ilike", `%${search}%`)
        .orWhere("agentWebhookReceipt.errorMessage", "ilike", `%${search}%`);
    });

  const countQuery = base
    .clone()
    .select("agentWebhookReceipt.id as id")
    .as("webhookReceiptCount");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count, 10) : 0;

  const receipts = await base
    .clone()
    .select(
      "agentWebhookReceipt.id",
      "agentWebhookReceipt.agentId",
      "agentWebhookReceipt.agentName",
      "agentWebhookReceipt.webhookKey",
      "agentWebhookReceipt.provider",
      "agentWebhookReceipt.method",
      "agentWebhookReceipt.path",
      "agentWebhookReceipt.providerEventId",
      "agentWebhookReceipt.providerEventType",
      "agentWebhookReceipt.verificationStatus",
      "agentWebhookReceipt.runStatus",
      "agentWebhookReceipt.success",
      "agentWebhookReceipt.responseStatusCode",
      "agentWebhookReceipt.errorMessage",
      "agentWebhookReceipt.startedAt",
      "agentWebhookReceipt.completedAt",
      "agentWebhookReceipt.durationMs",
      "agentWebhookReceipt.createdAt",
    )
    .orderBy(resolvedSortField, resolvedSortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: receipts,
    page,
    pageSize,
    totalAvailable,
  };
};

export default saGetWebhookReceiptTableData;
