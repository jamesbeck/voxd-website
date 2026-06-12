"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type WebhookReceiptDetail = {
  id: string;
  agentId: string | null;
  agentName: string;
  webhookKey: string;
  provider: string;
  method: string;
  path: string;
  headers: Record<string, unknown> | null;
  query: Record<string, unknown> | null;
  rawBody: string | null;
  payload: unknown;
  verificationStatus: string | null;
  verificationError: string | null;
  verificationMetadata: unknown;
  runStatus: string;
  success: boolean | null;
  responseStatusCode: number | null;
  providerEventId: string | null;
  providerEventType: string | null;
  output: unknown;
  responseBody: unknown;
  logs: unknown;
  errorMessage: string | null;
  errorCause: string | null;
  errorStack: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
};

const saGetWebhookReceiptById = async ({
  webhookReceiptId,
}: {
  webhookReceiptId: string;
}): Promise<
  | { success: true; data: WebhookReceiptDetail }
  | { success: false; error: string }
> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Unauthorized: Super admin access required",
    };
  }

  const receipt = await db("agentWebhookReceipt")
    .where("agentWebhookReceipt.id", webhookReceiptId)
    .select(
      "agentWebhookReceipt.id",
      "agentWebhookReceipt.agentId",
      "agentWebhookReceipt.agentName",
      "agentWebhookReceipt.webhookKey",
      "agentWebhookReceipt.provider",
      "agentWebhookReceipt.method",
      "agentWebhookReceipt.path",
      "agentWebhookReceipt.headers",
      "agentWebhookReceipt.query",
      "agentWebhookReceipt.rawBody",
      "agentWebhookReceipt.payload",
      "agentWebhookReceipt.verificationStatus",
      "agentWebhookReceipt.verificationError",
      "agentWebhookReceipt.verificationMetadata",
      "agentWebhookReceipt.runStatus",
      "agentWebhookReceipt.success",
      "agentWebhookReceipt.responseStatusCode",
      "agentWebhookReceipt.providerEventId",
      "agentWebhookReceipt.providerEventType",
      "agentWebhookReceipt.output",
      "agentWebhookReceipt.responseBody",
      "agentWebhookReceipt.logs",
      "agentWebhookReceipt.errorMessage",
      "agentWebhookReceipt.errorCause",
      "agentWebhookReceipt.errorStack",
      "agentWebhookReceipt.startedAt",
      "agentWebhookReceipt.completedAt",
      "agentWebhookReceipt.durationMs",
      "agentWebhookReceipt.createdAt",
      "agentWebhookReceipt.updatedAt",
    )
    .first();

  if (!receipt) {
    return {
      success: false,
      error: "Webhook receipt not found",
    };
  }

  return {
    success: true,
    data: receipt,
  };
};

export default saGetWebhookReceiptById;
