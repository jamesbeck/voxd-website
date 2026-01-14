"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const VALID_STATUSES = ["Open", "In Progress", "Closed"];

const saUpdateSupportTicketStatus = async ({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can change status
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Only super admins can change ticket status",
    };
  }

  if (!VALID_STATUSES.includes(status)) {
    return {
      success: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    };
  }

  // Verify ticket exists
  const ticket = await db("supportTicket")
    .where("id", ticketId)
    .select("id", "status")
    .first();

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  // Don't update if status is the same
  if (ticket.status === status) {
    return { success: true, data: { status } };
  }

  try {
    // Update the status
    await db("supportTicket").where("id", ticketId).update({ status });

    // Add a comment about the status change
    await db("supportTicketComment").insert({
      supportTicketId: ticketId,
      adminUserId: accessToken.adminUserId,
      comment: `Status changed to ${status}`,
    });

    return {
      success: true,
      data: { status },
    };
  } catch (error: any) {
    console.error("Error updating ticket status:", error);
    return {
      success: false,
      error: error?.message || "Failed to update status",
    };
  }
};

export default saUpdateSupportTicketStatus;
