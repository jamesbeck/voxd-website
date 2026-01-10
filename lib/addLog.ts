import db from "@/database/db";
import { headers } from "next/headers";

export interface AddLogParams {
  adminUserId?: string;
  apiKeyId?: string;
  organisationId?: string;
  partnerId?: string;
  sessionId?: string;
  agentId?: string;
  chatUserId?: string;
  event: string;
  description?: string;
  data?: Record<string, unknown>;
}

/**
 * Adds a log entry to the log table.
 * Automatically captures the client IP address from request headers.
 */
export async function addLog({
  adminUserId,
  apiKeyId,
  organisationId,
  partnerId,
  sessionId,
  agentId,
  chatUserId,
  event,
  description,
  data,
}: AddLogParams): Promise<void> {
  // Get IP address from headers
  const headersList = await headers();

  // Check common headers for client IP (in order of preference)
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") || // Cloudflare
    null;

  await db("log").insert({
    adminUserId: adminUserId || null,
    apiKeyId: apiKeyId || null,
    organisationId: organisationId || null,
    partnerId: partnerId || null,
    sessionId: sessionId || null,
    agentId: agentId || null,
    chatUserId: chatUserId || null,
    event,
    description: description || "",
    data: data ? JSON.stringify(data) : null,
    ipAddress,
  });
}

export default addLog;
