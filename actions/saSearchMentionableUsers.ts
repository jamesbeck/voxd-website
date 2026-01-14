"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type MentionableUser = {
  id: string;
  name: string | null;
  email: string;
};

const saSearchMentionableUsers = async ({
  ticketId,
  search,
}: {
  ticketId: string;
  search: string;
}): Promise<
  { success: true; data: MentionableUser[] } | { success: false; error: string }
> => {
  const accessToken = await verifyAccessToken();

  // Get the ticket to determine which users can be mentioned
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

  // Search for mentionable users:
  // 1. Users belonging to the organisation that owns the agent
  // 2. Users belonging to the partner that owns the organisation
  // 3. Super admin users
  const users = await db("adminUser")
    .where(function () {
      this.where("organisationId", ticket.organisationId)
        .orWhere("partnerId", ticket.partnerId)
        .orWhere("superAdmin", true);
    })
    .andWhere(function () {
      if (search) {
        this.where("name", "ilike", `%${search}%`).orWhere(
          "email",
          "ilike",
          `%${search}%`
        );
      }
    })
    .select("id", "name", "email")
    .orderBy("name", "asc")
    .limit(10);

  return {
    success: true,
    data: users,
  };
};

export default saSearchMentionableUsers;
