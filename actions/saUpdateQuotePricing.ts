"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateQuotePricing = async ({
  quoteId,
  setupFee,
  monthlyFee,
  setupFeeVoxdCost,
  monthlyFeeVoxdCost,
}: {
  quoteId: string;
  setupFee?: number | null;
  monthlyFee?: number | null;
  setupFeeVoxdCost?: number | null;
  monthlyFeeVoxdCost?: number | null;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  const accessToken = await verifyAccessToken();

  // Find the existing quote with organisation data
  const existingQuote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .select("quote.*", "organisation.partnerId")
    .where({ "quote.id": quoteId })
    .first();

  if (!existingQuote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Check if user is super admin or the partner that owns this quote
  const isSuperAdmin = accessToken.superAdmin;
  const isOwnerPartner =
    accessToken.partner && accessToken.partnerId === existingQuote.partnerId;

  if (!isSuperAdmin && !isOwnerPartner) {
    return {
      success: false,
      error: "You don't have permission to update this quote's pricing",
    };
  }

  // Build the update object based on permissions
  const updateData: Record<string, number | null | undefined> = {};

  // Partners can update setupFee and monthlyFee
  if (isOwnerPartner || isSuperAdmin) {
    if (setupFee !== undefined) updateData.setupFee = setupFee;
    if (monthlyFee !== undefined) updateData.monthlyFee = monthlyFee;
  }

  // Only super admins can update the Voxd cost fields
  if (isSuperAdmin) {
    if (setupFeeVoxdCost !== undefined)
      updateData.setupFeeVoxdCost = setupFeeVoxdCost;
    if (monthlyFeeVoxdCost !== undefined)
      updateData.monthlyFeeVoxdCost = monthlyFeeVoxdCost;
  }

  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: "No fields to update",
    };
  }

  // Update the quote
  await db("quote").where({ id: quoteId }).update(updateData);

  // If the quote is at "Sent to Voxd for Cost Pricing" and both Voxd cost fields are now set,
  // automatically advance to "Cost Pricing Received from Voxd"
  if (existingQuote.status === "Sent to Voxd for Cost Pricing") {
    // Get the updated quote to check the new values
    const updatedQuote = await db("quote")
      .select("setupFeeVoxdCost", "monthlyFeeVoxdCost")
      .where({ id: quoteId })
      .first();

    if (
      updatedQuote.setupFeeVoxdCost != null &&
      updatedQuote.monthlyFeeVoxdCost != null
    ) {
      await db("quote").where({ id: quoteId }).update({
        status: "Cost Pricing Received from Voxd",
      });
    }
  }

  return { success: true };
};

export default saUpdateQuotePricing;
