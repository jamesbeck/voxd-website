"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

type DeleteQuoteParams = {
  quoteId: string;
};

type DeleteQuoteResponse = {
  success: boolean;
  error?: string;
};

export default async function saDeleteQuote(
  params: DeleteQuoteParams
): Promise<DeleteQuoteResponse> {
  const { quoteId } = params;

  // Verify access token
  const accessToken = await verifyAccessToken();
  if (!accessToken) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    // Get the quote and organisation to check ownership
    const quote = await db("quote")
      .where({ "quote.id": quoteId })
      .leftJoin("organisation", "quote.organisationId", "organisation.id")
      .select("quote.id", "organisation.partnerId")
      .first();

    if (!quote) {
      return {
        success: false,
        error: "Quote not found",
      };
    }

    // Check permissions: super admin or owner partner
    const isSuperAdmin = accessToken.superAdmin;
    const isOwnerPartner =
      accessToken.partner &&
      accessToken.partnerId &&
      quote.partnerId === accessToken.partnerId;

    console.log("Delete quote permission check:", {
      isSuperAdmin,
      isOwnerPartner,
      accessTokenPartnerId: accessToken.partnerId,
      organisationPartnerId: quote.partnerId,
      accessTokenPartner: accessToken.partner,
    });

    if (!isSuperAdmin && !isOwnerPartner) {
      return {
        success: false,
        error: "You do not have permission to delete this quote",
      };
    }

    // Delete the quote
    await db("quote").where({ id: quoteId }).delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting quote:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
