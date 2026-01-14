"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type SupportTicketComment = {
  id: string;
  comment: string;
  createdAt: Date;
  adminUserId: string;
  adminUserName: string | null;
  adminUserEmail: string | null;
};

const saGetSupportTicketComments = async ({
  ticketId,
}: {
  ticketId: string;
}): Promise<
  | { success: true; data: SupportTicketComment[] }
  | { success: false; error: string }
> => {
  const accessToken = await verifyAccessToken();

  // First verify access to the ticket
  const ticket = await db("supportTicket")
    .join("agent", "supportTicket.agentId", "agent.id")
    .join("organisation", "agent.organisationId", "organisation.id")
    .where("supportTicket.id", ticketId)
    .select("organisation.partnerId", "organisation.id as organisationId")
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

  const comments = await db("supportTicketComment")
    .leftJoin("adminUser", "supportTicketComment.adminUserId", "adminUser.id")
    .where("supportTicketComment.supportTicketId", ticketId)
    .select(
      "supportTicketComment.id",
      "supportTicketComment.comment",
      "supportTicketComment.createdAt",
      "supportTicketComment.adminUserId",
      "adminUser.name as adminUserName",
      "adminUser.email as adminUserEmail"
    )
    .orderBy("supportTicketComment.createdAt", "asc");

  return {
    success: true,
    data: comments,
  };
};

export default saGetSupportTicketComments;
