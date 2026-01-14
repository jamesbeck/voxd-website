"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type TicketsByMessage = {
  [messageId: string]: {
    id: string;
    ticketNumber: number;
    title: string;
    status: string;
    createdByName: string | null;
    createdAt: Date;
  }[];
};

const saGetTicketsByMessageIds = async ({
  userMessageIds,
  assistantMessageIds,
}: {
  userMessageIds: string[];
  assistantMessageIds: string[];
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  if (userMessageIds.length === 0 && assistantMessageIds.length === 0) {
    return { success: true, data: {} };
  }

  try {
    // Get tickets for user messages
    const userTickets =
      userMessageIds.length > 0
        ? await db("supportTicket")
            .leftJoin("adminUser", "supportTicket.adminUserId", "adminUser.id")
            .whereIn("supportTicket.userMessageId", userMessageIds)
            .whereIn("supportTicket.status", ["Open", "In Progress"])
            .select(
              "supportTicket.id",
              "supportTicket.ticketNumber",
              "supportTicket.title",
              "supportTicket.status",
              "supportTicket.createdAt",
              "supportTicket.userMessageId as messageId",
              db.raw(
                'COALESCE("adminUser".name, "adminUser".email) as "createdByName"'
              )
            )
        : [];

    // Get tickets for assistant messages
    const assistantTickets =
      assistantMessageIds.length > 0
        ? await db("supportTicket")
            .leftJoin("adminUser", "supportTicket.adminUserId", "adminUser.id")
            .whereIn("supportTicket.assistantMessageId", assistantMessageIds)
            .whereIn("supportTicket.status", ["Open", "In Progress"])
            .select(
              "supportTicket.id",
              "supportTicket.ticketNumber",
              "supportTicket.title",
              "supportTicket.status",
              "supportTicket.createdAt",
              "supportTicket.assistantMessageId as messageId",
              db.raw(
                'COALESCE("adminUser".name, "adminUser".email) as "createdByName"'
              )
            )
        : [];

    // Group tickets by message ID
    const ticketsByMessage: TicketsByMessage = {};

    [...userTickets, ...assistantTickets].forEach((ticket) => {
      if (!ticketsByMessage[ticket.messageId]) {
        ticketsByMessage[ticket.messageId] = [];
      }
      ticketsByMessage[ticket.messageId].push({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        createdByName: ticket.createdByName,
        createdAt: ticket.createdAt,
      });
    });

    return { success: true, data: ticketsByMessage };
  } catch (error: any) {
    console.error("Error fetching tickets by message IDs:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch tickets",
    };
  }
};

export default saGetTicketsByMessageIds;
