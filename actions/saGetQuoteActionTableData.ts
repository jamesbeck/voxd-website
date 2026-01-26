"use server";

import db from "../database/db";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const saGetQuoteActionTableData = async ({
  quoteId,
  page = 1,
  pageSize = 100,
  sortField = "dateTime",
  sortDirection = "desc",
}: ServerActionReadParams<{
  quoteId: string;
}>): Promise<ServerActionReadResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  const offset = (page - 1) * pageSize;

  // Build the query
  const query = db("quoteAction")
    .leftJoin("adminUser", "quoteAction.adminUserId", "adminUser.id")
    .where("quoteAction.quoteId", quoteId)
    .select(
      "quoteAction.id",
      "quoteAction.action",
      "quoteAction.dateTime",
      "quoteAction.adminUserId",
      "adminUser.name as adminUserName",
      "adminUser.email as adminUserEmail",
    );

  // Get total count
  const countResult = await db("quoteAction")
    .where("quoteId", quoteId)
    .count("id as count")
    .first();
  const totalAvailable = Number(countResult?.count || 0);

  // Apply sorting
  const validSortFields = ["dateTime", "action", "adminUserName"];
  const actualSortField = validSortFields.includes(sortField)
    ? sortField
    : "dateTime";

  // Get data with pagination
  const data = await query
    .orderBy(actualSortField, sortDirection)
    .limit(pageSize)
    .offset(offset);

  return {
    success: true,
    data,
    totalAvailable,
    page,
    pageSize,
  };
};

export default saGetQuoteActionTableData;
