"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

type SupportTicketParams = {
  statusFilter?: "open" | "closed";
};

const saGetSupportTicketTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "createdAt",
  sortDirection = "desc",
  statusFilter = "open",
}: ServerActionReadParams<SupportTicketParams>): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  const base = db("supportTicket")
    .join("agent", "supportTicket.agentId", "agent.id")
    .join("organisation", "agent.organisationId", "organisation.id")
    .leftJoin(
      "adminUser as createdBy",
      "supportTicket.adminUserId",
      "createdBy.id"
    )
    .where((qb) => {
      if (search) {
        qb.where("supportTicket.title", "ilike", `%${search}%`);
        qb.orWhere(
          db.raw('"supportTicket"."ticketNumber"::text'),
          "ilike",
          `%${search}%`
        );
      }
    });

  // Filter by status
  if (statusFilter === "open") {
    base.whereNot("supportTicket.status", "Closed");
  } else if (statusFilter === "closed") {
    base.where("supportTicket.status", "Closed");
  }

  // Regular organisation users can only see tickets for agents their organisation owns
  if (!accessToken.partner && !accessToken.superAdmin) {
    if (accessToken.organisationId) {
      base.where("agent.organisationId", accessToken.organisationId);
    } else {
      // Regular user without organisationId should see nothing
      base.whereRaw("1 = 0");
    }
  }

  // Partners can see tickets for agents belonging to organisations they own
  if (accessToken.partner && !accessToken.superAdmin) {
    base.where("organisation.partnerId", accessToken.partnerId);
  }

  // Super admins can see all tickets (no filter needed)

  // Count query
  const countQuery = base.clone().select("supportTicket.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const tickets = await base
    .clone()
    .select(
      "supportTicket.id",
      "supportTicket.ticketNumber",
      "supportTicket.title",
      "supportTicket.description",
      "supportTicket.status",
      "supportTicket.createdAt",
      "agent.id as agentId",
      "agent.niceName as agentName",
      "organisation.id as organisationId",
      "organisation.name as organisationName",
      "createdBy.name as createdByName",
      "createdBy.email as createdByEmail"
    )
    .orderByRaw(`?? ${sortDirection} NULLS LAST`, [
      sortField === "createdAt" ? "supportTicket.createdAt" : sortField,
    ])
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: tickets,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetSupportTicketTableData;
