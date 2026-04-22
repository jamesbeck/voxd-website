"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const saUpdateQuotePricing = async ({
  quoteId,
  setupFee,
  monthlyFee,
  hourlyRate,
  contractNotes,
  setupFeeVoxdCost,
  monthlyFeeVoxdCost,
  buildDays,
  freeMonthlyMinutes,
  contractLength,
}: {
  quoteId: string;
  setupFee?: number | null;
  monthlyFee?: number | null;
  hourlyRate?: number | null;
  contractNotes?: string | null;
  setupFeeVoxdCost?: number | null;
  monthlyFeeVoxdCost?: number | null;
  buildDays?: number | null;
  freeMonthlyMinutes?: number | null;
  contractLength?: number | null;
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
  const updateData: Record<string, number | string | null | undefined> = {};

  // Partners can update setupFee, monthlyFee, hourlyRate, and contractLength
  if (isOwnerPartner || isSuperAdmin) {
    if (setupFee !== undefined) updateData.setupFee = setupFee;
    if (monthlyFee !== undefined) updateData.monthlyFee = monthlyFee;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (contractNotes !== undefined) updateData.contractNotes = contractNotes;
    if (contractLength !== undefined) {
      // Non-admin users cannot set contract length below 12 months
      if (!isSuperAdmin && contractLength !== null && contractLength < 12) {
        return {
          success: false,
          error:
            "Contract length must be at least 12 months. Contact Voxd if you need a shorter contract.",
        };
      }
      updateData.contractLength = contractLength;
    }
  }

  // Only super admins can update the Voxd cost fields, buildDays, and freeMonthlyMinutes
  if (isSuperAdmin) {
    if (setupFeeVoxdCost !== undefined)
      updateData.setupFeeVoxdCost = setupFeeVoxdCost;
    if (monthlyFeeVoxdCost !== undefined)
      updateData.monthlyFeeVoxdCost = monthlyFeeVoxdCost;
    if (buildDays !== undefined) updateData.buildDays = buildDays;
    if (freeMonthlyMinutes !== undefined)
      updateData.freeMonthlyMinutes = freeMonthlyMinutes;
  }

  if (Object.keys(updateData).length === 0) {
    return {
      success: false,
      error: "No fields to update",
    };
  }

  // Update the quote
  await db("quote").where({ id: quoteId }).update(updateData);

  return { success: true };
};

export default saUpdateQuotePricing;
