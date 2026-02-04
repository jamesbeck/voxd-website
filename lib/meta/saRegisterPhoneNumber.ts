"use server";

import db from "@/database/db";

/**
 * Get access token for a phone number by its Meta ID via its WABA
 */
async function getAccessTokenForPhoneNumberMetaId(
  metaId: string,
): Promise<string | null> {
  const phoneNumber = await db("phoneNumber").where({ metaId }).first();

  if (phoneNumber?.wabaId) {
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

export default async function saSetNumberWebhook({
  phoneNumberId,
}: {
  phoneNumberId: string;
}) {
  console.log("reg:", phoneNumberId);
  const accessToken = await getAccessTokenForPhoneNumberMetaId(phoneNumberId);
  if (!accessToken) {
    throw new Error(
      "No access token available for this phone number. Please ensure it is linked to an app via its WABA.",
    );
  }
  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${phoneNumberId}/register`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin: process.env.PHONE_NUMBER_2FA_PIN!,
    }),
  });

  //pins I've used not realising they're important...
  // 212834 - blossom
  // 231084 - io shield

  const data = await response.json();

  console.log(data);

  return data;
}
