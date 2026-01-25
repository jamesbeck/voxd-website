"use server";

import { ServerActionResponse } from "@/types/types";
import db from "@/database/db";
import {
  phoneNumberFields,
  type PhoneNumberMetaResponse,
} from "@/lib/meta/phoneNumberConstants";

const GRAPH_URL = process.env.META_GRAPH_URL!;

/**
 * Get the access token for a phone number by looking up the app via its WABA.
 */
async function getAccessTokenForPhoneNumber(
  phoneNumberMetaId: string,
): Promise<string | null> {
  // Look up phone number and its WABA
  const phoneNumber = await db("phoneNumber")
    .where({ metaId: phoneNumberMetaId })
    .first();

  if (phoneNumber?.wabaId) {
    // Get the WABA to find its linked app
    const waba = await db("waba").where({ id: phoneNumber.wabaId }).first();

    if (waba?.appId) {
      const app = await db("app").where({ id: waba.appId }).first();
      if (app?.accessToken) {
        return app.accessToken;
      }
    }
  }

  return null;
}

/**
 * Sync a single phone number from Meta API to the database.
 * Can be called with either:
 * - phoneNumberId: our database ID (will look up metaId)
 * - metaId: the Meta phone number ID directly
 * - wabaId: optional, to associate with a specific WABA in our db
 * - accessToken: optional, if not provided will look up from app table
 */
export async function syncPhoneNumberFromMeta({
  metaId,
  wabaId,
  accessToken,
}: {
  metaId: string;
  wabaId?: string;
  accessToken?: string;
}): Promise<void> {
  // If no access token provided, look it up
  let token = accessToken;
  if (!token) {
    token = (await getAccessTokenForPhoneNumber(metaId)) || undefined;
  }

  if (!token) {
    throw new Error(
      "No access token available for this phone number. Please ensure it's linked to an app.",
    );
  }

  const qs = new URLSearchParams({
    fields: phoneNumberFields,
    access_token: token,
  }).toString();

  const url = `${GRAPH_URL}/${metaId}/?${qs}`;
  const res = await fetch(url, { cache: "no-store" });
  const phoneNumberResponse: PhoneNumberMetaResponse = await res.json();

  if (phoneNumberResponse.error) {
    throw new Error(
      phoneNumberResponse.error.message ||
        "Error fetching phone number from Meta",
    );
  }

  // Do we already have this phone number?
  const existingPhoneNumber = await db("phoneNumber").where({ metaId }).first();

  if (existingPhoneNumber) {
    // Update
    await db("phoneNumber")
      .where({ metaId })
      .update({
        wabaId: wabaId ?? existingPhoneNumber.wabaId,
        accountMode: phoneNumberResponse.account_mode,
        status: phoneNumberResponse.status,
        displayPhoneNumber: phoneNumberResponse.display_phone_number,
        healthStatus: JSON.stringify(phoneNumberResponse.health_status),
        messagingLimitTier: phoneNumberResponse.messaging_limit_tier,
        nameStatus: phoneNumberResponse.name_status,
        qualityScore: JSON.stringify(phoneNumberResponse.quality_score),
        verifiedName: phoneNumberResponse.verified_name,
        platformType: phoneNumberResponse.platform_type,
        webhookConfiguration: JSON.stringify(
          phoneNumberResponse.webhook_configuration,
        ),
      });
  } else {
    // Create
    await db("phoneNumber").insert({
      metaId,
      wabaId,
      accountMode: phoneNumberResponse.account_mode,
      status: phoneNumberResponse.status,
      displayPhoneNumber: phoneNumberResponse.display_phone_number,
      healthStatus: JSON.stringify(phoneNumberResponse.health_status),
      messagingLimitTier: phoneNumberResponse.messaging_limit_tier,
      nameStatus: phoneNumberResponse.name_status,
      qualityScore: JSON.stringify(phoneNumberResponse.quality_score),
      verifiedName: phoneNumberResponse.verified_name,
      platformType: phoneNumberResponse.platform_type,
      webhookConfiguration: JSON.stringify(
        phoneNumberResponse.webhook_configuration,
      ),
    });
  }
}

/**
 * Server action to sync a phone number with Meta.
 * Takes our database phoneNumberId, looks up the metaId, and syncs.
 */
export default async function saSyncPhoneNumberWithMeta({
  phoneNumberId,
}: {
  phoneNumberId: string;
}): Promise<ServerActionResponse> {
  try {
    const dbPhoneNumber = await db("phoneNumber")
      .where({ id: phoneNumberId })
      .first();

    if (!dbPhoneNumber) {
      return { success: false, error: "Phone number not found" };
    }

    await syncPhoneNumberFromMeta({
      metaId: dbPhoneNumber.metaId,
      wabaId: dbPhoneNumber.wabaId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error syncing phone number with Meta:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error syncing phone number with Meta",
    };
  }
}
