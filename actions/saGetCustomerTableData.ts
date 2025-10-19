"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import {
  ServerActionReadResponse,
  ServerActionReadParams,
} from "@/types/types";

const saGetCustomerTableData = async ({
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

  const base = db("customer")
    .leftJoin("agent", "customer.id", "agent.customerId")
    .leftJoin("customerUser", "customer.id", "customerUser.customerId")
    .groupBy("customer.id")
    .where((qb) => {
      if (search) {
        qb.where("customer.name", "ilike", `%${search}%`);
      }
    });

  //if not admin add where clause to only get the agent with the email from the access token
  if (accessToken?.partner) {
    console.log("Filtering customers by partnerId", accessToken.partnerId);
    base.where("customer.partnerId", accessToken.partnerId);
  }

  //count query
  const countQuery = base.clone().select("customer.id");
  const countResult = await db
    .count<{ count: string }>("id")
    .from(countQuery)
    .first();

  const totalAvailable = countResult ? parseInt(countResult.count) : 0;

  const customers = await base
    .clone()
    .select("customer.*")
    .select([db.raw('COUNT("agent"."id")::int as "agentCount"')])
    .select([db.raw('COUNT("customerUser"."id")::int as "userCount"')])
    .orderBy(sortField, sortDirection)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    success: true,
    data: customers,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetCustomerTableData;
