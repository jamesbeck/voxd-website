"use server";

import { syncPhoneNumberFromMeta } from "@/actions/saSyncPhoneNumberWithMeta";
import db from "@/database/db";

/**
 * Get access token for a phone number by its Meta ID via its WABA
 */
async function getAccessTokenForPhoneNumberMetaId(
  metaId: string,
): Promise<string | null> {
  // Look up phone number by metaId
  const phoneNumber = await db("phoneNumber").where({ metaId }).first();

  if (phoneNumber?.wabaId) {
    // Get the WABA to find its linked app
    const waba = await db("waba").where({ id: phoneNumber.wabaId }).first();

    if (waba?.appId) {
      const app = await db("metaApp").where({ id: waba.appId }).first();
      if (app?.accessToken) {
        return app.accessToken;
      }
    }
  }

  return null;
}

export default async function saClearNumberWebhook({
  numberId,
}: {
  numberId: string;
}) {
  const accessToken = await getAccessTokenForPhoneNumberMetaId(numberId);
  if (!accessToken) {
    throw new Error(
      "No access token available for this phone number. Please ensure it is linked to an app.",
    );
  }

  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${numberId}`;

  console.log(url);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      webhook_configuration: {
        override_callback_uri: null,
      },
    }),
  });

  const data = await response.json();

  console.log(data);

  // Re-sync the phone number with Meta to update local data
  await syncPhoneNumberFromMeta({ metaId: numberId, accessToken });

  return data;
}
