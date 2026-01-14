"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type SupportTicketDetail = {
  id: string;
  ticketNumber: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  agentId: string;
  agentName: string;
  organisationId: string;
  organisationName: string;
  createdById: string;
  createdByName: string | null;
  createdByEmail: string | null;
  userMessageId: string | null;
  assistantMessageId: string | null;
  userMessageText: string | null;
  assistantMessageText: string | null;
  sessionId: string | null;
};

const saGetSupportTicketById = async ({
  ticketId,
}: {
  ticketId: string;
}): Promise<
  | { success: true; data: SupportTicketDetail }
  | { success: false; error: string }
> => {
  const accessToken = await verifyAccessToken();

  const ticket = await db("supportTicket")
    .join("agent", "supportTicket.agentId", "agent.id")
    .join("organisation", "agent.organisationId", "organisation.id")
    .leftJoin(
      "adminUser as createdBy",
      "supportTicket.adminUserId",
      "createdBy.id"
    )
    .leftJoin("userMessage", "supportTicket.userMessageId", "userMessage.id")
    .leftJoin(
      "assistantMessage",
      "supportTicket.assistantMessageId",
      "assistantMessage.id"
    )
    .where("supportTicket.id", ticketId)
    .select(
      "supportTicket.id",
      "supportTicket.ticketNumber",
      "supportTicket.title",
      "supportTicket.description",
      "supportTicket.status",
      "supportTicket.createdAt",
      "supportTicket.userMessageId",
      "supportTicket.assistantMessageId",
      "agent.id as agentId",
      "agent.niceName as agentName",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "organisation.partnerId",
      "createdBy.id as createdById",
      "createdBy.name as createdByName",
      "createdBy.email as createdByEmail",
      "userMessage.text as userMessageText",
      "assistantMessage.text as assistantMessageText",
      db.raw(
        'COALESCE("userMessage"."sessionId", "assistantMessage"."sessionId") as "sessionId"'
      )
    )
    .first();

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  // Check access control
  if (!accessToken.superAdmin) {
    if (accessToken.partner) {
      if (ticket.partnerId !== accessToken.partnerId) {
        return {
          success: false,
          error: "You don't have access to this ticket",
        };
      }
    } else {
      if (ticket.organisationId !== accessToken.organisationId) {
        return {
          success: false,
          error: "You don't have access to this ticket",
        };
      }
    }
  }

  return {
    success: true,
    data: ticket,
  };
};

export default saGetSupportTicketById;
