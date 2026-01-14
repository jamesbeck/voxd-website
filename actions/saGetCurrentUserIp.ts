"use server";

import { headers } from "next/headers";

/**
 * Gets the current user's IP address from request headers.
 */
const saGetCurrentUserIp = async (): Promise<string | null> => {
  const headersList = await headers();

  // Check common headers for client IP (in order of preference)
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") || // Cloudflare
    null;

  return ipAddress;
};

export default saGetCurrentUserIp;
