"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";
import { notFound } from "next/navigation";

const saGetQuoteTableData = async ({
  search,
  page = 1,
  pageSize = 100,
  sortField = "id",
  sortDirection = "asc",
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.admin && !accessToken.partner)
    return {
      success: false,
      error: "You do not have permission to view customers.",
    };

  const base = db("quote")
    .leftJoin("customer", "customer.id", "quote.customerId")
    .groupBy("quote.id", "customer.id")
    .where((qb) => {
      if (search) {
        qb.where("customer.name", "ilike", `%${search}%`);
      }
    });

  //if not admin add where clause to only get the agent with the email from the access token
  if (accessToken?.partner) {
    base.where("customer.partnerId", accessToken.partnerId);
  }

  //count query
  const countQuery = base.clone().select("customer.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const quotes = await base
    .clone()
    .select("quote.*", "customer.name as customerName")

    // .select([db.raw('COUNT("agent"."id")::int as "agentCount"')])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: quotes,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetQuoteTableData;
