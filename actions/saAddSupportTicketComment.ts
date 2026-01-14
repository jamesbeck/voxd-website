"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saAddSupportTicketComment = async ({
  ticketId,
  comment,
}: {
  ticketId: string;
  comment: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!comment?.trim()) {
    return { success: false, error: "Comment is required" };
  }

  // First verify access to the ticket
  const ticket = await db("supportTicket")
    .join("agent", "supportTicket.agentId", "agent.id")
    .join("organisation", "agent.organisationId", "organisation.id")
    .where("supportTicket.id", ticketId)
    .select(
      "supportTicket.id",
      "organisation.partnerId",
      "organisation.id as organisationId"
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

  try {
    const [newComment] = await db("supportTicketComment")
      .insert({
        supportTicketId: ticketId,
        adminUserId: accessToken.adminUserId,
        comment: comment.trim(),
      })
      .returning(["id", "createdAt"]);

    return {
      success: true,
      data: newComment,
    };
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return {
      success: false,
      error: error?.message || "Failed to add comment",
    };
  }
};

export default saAddSupportTicketComment;
