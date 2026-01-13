"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";

const saUpdateQuotePitch = async ({
  quoteId,
  pitchPersonalMessage,
  generatedPitchIntroduction,
  generatedPitch,
}: {
  quoteId: string;
  pitchPersonalMessage?: string;
  generatedPitchIntroduction?: string;
  generatedPitch?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return {
      success: false,
      error: "Quote ID is required",
    };
  }

  const existingQuote = await db("quote")
    .select("id")
    .where({ id: quoteId })
    .first();

  if (!existingQuote) {
    return {
      success: false,
      error: "Quote not found",
    };
  }

  // Build update object with only provided values
  const updateData: Record<string, any> = {};
  if (pitchPersonalMessage !== undefined)
    updateData.pitchPersonalMessage = pitchPersonalMessage;
  if (generatedPitchIntroduction !== undefined)
    updateData.generatedPitchIntroduction = generatedPitchIntroduction;
  if (generatedPitch !== undefined) updateData.generatedPitch = generatedPitch;

  if (Object.keys(updateData).length === 0) {
    return { success: true }; // Nothing to update
  }

  await db("quote").where({ id: quoteId }).update(updateData);

  return { success: true };
};

export default saUpdateQuotePitch;
