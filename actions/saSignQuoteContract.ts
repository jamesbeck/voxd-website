"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saSignQuoteContract = async ({
  quoteId,
  signOffName,
  signOffEmail,
  signOffPosition,
  ipAddress,
  userAgent,
}: {
  quoteId: string;
  signOffName: string;
  signOffEmail: string;
  signOffPosition: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  if (!signOffName || signOffName.trim() === "") {
    return {
      success: false,
      fieldErrors: { signOffName: "Legal name is required" },
    };
  }

  if (!signOffEmail || signOffEmail.trim() === "") {
    return {
      success: false,
      fieldErrors: { signOffEmail: "Email address is required" },
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(signOffEmail)) {
    return {
      success: false,
      fieldErrors: { signOffEmail: "Please enter a valid email address" },
    };
  }

  if (!signOffPosition || signOffPosition.trim() === "") {
    return {
      success: false,
      fieldErrors: { signOffPosition: "Position is required" },
    };
  }

  // Find the existing quote
  const existingQuote = await db("quote")
    .select("*")
    .where({ id: quoteId })
    .first();

  if (!existingQuote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Only prevent signing if already signed (Closed Won)
  if (existingQuote.status === "Closed Won") {
    return {
      success: false,
      error: "This proposal has already been signed",
    };
  }

  // Update the quote with sign-off details and change status to Closed Won
  await db("quote").where({ id: quoteId }).update({
    signOffName: signOffName.trim(),
    signOffEmail: signOffEmail.trim().toLowerCase(),
    signOffPosition: signOffPosition.trim(),
    signOffDate: new Date(),
    signOffIPAddress: ipAddress,
    signOffUserAgent: userAgent,
    status: "Closed Won",
  });

  return { success: true };
};

export default saSignQuoteContract;
