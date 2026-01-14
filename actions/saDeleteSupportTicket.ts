"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saDeleteSupportTicket = async ({
  ticketId,
}: {
  ticketId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can delete tickets
  if (!accessToken.superAdmin) {
    return { success: false, error: "Only super admins can delete tickets" };
  }

  // Verify ticket exists
  const ticket = await db("supportTicket")
    .where("id", ticketId)
    .select("id", "ticketNumber")
    .first();

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  try {
    // Delete comments first (foreign key constraint)
    await db("supportTicketComment").where("supportTicketId", ticketId).del();

    // Delete the ticket
    await db("supportTicket").where("id", ticketId).del();

    return {
      success: true,
      data: { ticketNumber: ticket.ticketNumber },
    };
  } catch (error: any) {
    console.error("Error deleting support ticket:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete ticket",
    };
  }
};

export default saDeleteSupportTicket;
