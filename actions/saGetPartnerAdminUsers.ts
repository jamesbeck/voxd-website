"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { TableFilterOption } from "@/types/types";

/**
 * Get admin users belonging to partner organisations.
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

  const adminUsersQuery = db("adminUser")
    .leftJoin("organisation", "adminUser.organisationId", "organisation.id")
    .select("adminUser.id", "adminUser.name", "adminUser.email")
    .where("organisation.partner", true)
    .orderBy("name", "asc");

  if (!accessToken.superAdmin) {
    if (!accessToken.partnerId) {
      return {
        success: false,
        error: "No partner organisation found for the logged-in user.",
      };
    }

    adminUsersQuery.where("adminUser.organisationId", accessToken.partnerId);
  }

  const adminUsers = await adminUsersQuery;

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
