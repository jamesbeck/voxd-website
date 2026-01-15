"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const saUpdateSupportTicket = async ({
  ticketId,
  title,
  description,
}: {
  ticketId: string;
  title: string;
  description?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admin users can edit support tickets
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to edit support tickets",
    };
  }

  if (!ticketId) {
    return {
      success: false,
      error: "Ticket ID is required",
    };
  }

  if (!title || title.trim().length === 0) {
    return {
      success: false,
      error: "Title is required",
    };
  }

  // Find the existing ticket
  const existingTicket = await db("supportTicket")
    .select("*")
    .where({ id: ticketId })
    .first();

  if (!existingTicket) {
    return {
      success: false,
      error: "Support ticket not found",
    };
  }

  // Update the support ticket
  await db("supportTicket")
    .where({ id: ticketId })
    .update({
      title: title.trim(),
      description: description?.trim() || null,
    });

  // Log ticket update
  await addLog({
    adminUserId: accessToken.adminUserId,
    event: "Support Ticket Updated",
    description: `Support ticket #${existingTicket.ticketNumber} "${title}" updated`,
    organisationId: existingTicket.organisationId,
    agentId: existingTicket.agentId,
    sessionId: existingTicket.sessionId,
    data: {
      ticketId,
      ticketNumber: existingTicket.ticketNumber,
      previousTitle: existingTicket.title,
      newTitle: title.trim(),
      previousDescription: existingTicket.description,
      newDescription: description?.trim() || null,
    },
  });

  return { success: true };
};

export default saUpdateSupportTicket;
