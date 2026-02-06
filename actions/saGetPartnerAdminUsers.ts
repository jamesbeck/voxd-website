"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { TableFilterOption } from "@/types/types";

/**
 * Get admin users belonging to the logged-in user's partner.
 * Used for filter dropdowns where we need to show partner-scoped admin users.
 */
const saGetPartnerAdminUsers = async (): Promise<{
  success: boolean;
  data?: TableFilterOption[];
  error?: string;
}> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken.superAdmin && !accessToken.partner) {
    return {
      success: false,
      error: "You do not have permission to view admin users.",
    };
  }

  // Get admin users for the logged-in user's partner
  const partnerId = accessToken.partnerId;

  if (!partnerId) {
    return {
      success: false,
      error: "No partner ID found for the logged-in user.",
    };
  }

  const adminUsers = await db("adminUser")
    .select("id", "name", "email")
    .where("partnerId", partnerId)
    .orderBy("name", "asc");

  const options: TableFilterOption[] = adminUsers.map((user) => ({
    label: user.name + (user.email ? ` (${user.email})` : ""),
    value: user.id,
  }));

  return {
    success: true,
    data: options,
  };
};

export default saGetPartnerAdminUsers;
