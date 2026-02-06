"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { TableFilterOption } from "@/types/types";

/**
 * Get all partners for filter dropdowns.
 * Only available to super admins.
 */
const saGetAllPartners = async (): Promise<{
  success: boolean;
  data?: TableFilterOption[];
  error?: string;
}> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can view all partners
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "You do not have permission to view all partners.",
    };
  }

  const partners = await db("partner")
    .select("id", "name")
    .orderBy("name", "asc");

  const options: TableFilterOption[] = partners.map((partner) => ({
    label: partner.name,
    value: partner.id,
  }));

  return {
    success: true,
    data: options,
  };
};

export default saGetAllPartners;
