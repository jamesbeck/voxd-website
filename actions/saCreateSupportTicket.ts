"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type CreateSupportTicketInput = {
  agentId: string;
  title: string;
  description: string;
  messageId?: string;
  messageType?: "user" | "assistant";
};

const saCreateSupportTicket = async (
  input: CreateSupportTicketInput
): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  const { agentId, title, description, messageId, messageType } = input;

  if (!agentId || !title?.trim() || !description?.trim()) {
    return {
      success: false,
      error: "Agent ID, title, and description are required",
    };
  }

  // Verify user has access to this agent
  const agent = await db("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .where("agent.id", agentId)
    .select(
      "agent.id",
      "agent.niceName",
      "organisation.partnerId",
      "organisation.id as organisationId"
    )
    .first();

  if (!agent) {
    return { success: false, error: "Agent not found" };
  }

  // Check access control
  if (!accessToken.superAdmin) {
    if (accessToken.partner) {
      if (agent.partnerId !== accessToken.partnerId) {
        return { success: false, error: "You don't have access to this agent" };
      }
    } else {
      if (agent.organisationId !== accessToken.organisationId) {
        return { success: false, error: "You don't have access to this agent" };
      }
    }
  }

  // Create the support ticket
  try {
    const insertData: Record<string, any> = {
      agentId,
      adminUserId: accessToken.adminUserId,
      title: title.trim(),
      description,
      status: "Open",
    };

    // Add message reference if provided
    if (messageId && messageType) {
      if (messageType === "user") {
        insertData.userMessageId = messageId;
      } else if (messageType === "assistant") {
        insertData.assistantMessageId = messageId;
      }
    }

    const [newTicket] = await db("supportTicket")
      .insert(insertData)
      .returning(["id", "ticketNumber", "title", "status", "createdAt"]);

    return {
      success: true,
      data: newTicket,
    };
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return {
      success: false,
      error: error?.message || "Failed to create support ticket",
    };
  }
};

export default saCreateSupportTicket;
