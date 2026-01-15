"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type AgentTicket = {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  createdByName: string | null;
  createdAt: Date;
};

const saGetTicketsByAgentId = async ({
  agentId,
}: {
  agentId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    // Get all tickets for this agent
    const tickets = await db("supportTicket")
      .leftJoin("adminUser", "supportTicket.adminUserId", "adminUser.id")
      .where("supportTicket.agentId", agentId)
      .whereIn("supportTicket.status", [
        "Open",
        "In Progress",
        "Awaiting Client",
      ])
      .select(
        "supportTicket.id",
        "supportTicket.ticketNumber",
        "supportTicket.title",
        "supportTicket.status",
        "supportTicket.createdAt",
        db.raw(
          'COALESCE("adminUser".name, "adminUser".email) as "createdByName"'
        )
      )
      .orderBy("supportTicket.createdAt", "desc");

    return { success: true, data: tickets as AgentTicket[] };
  } catch (error: any) {
    console.error("Error fetching tickets by agent ID:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch tickets",
    };
  }
};

export default saGetTicketsByAgentId;
