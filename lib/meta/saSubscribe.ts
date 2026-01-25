"use server";

import db from "@/database/db";

/**
 * Get access token and meta ID for a WABA by its database ID
 */
async function getWabaDetails(
  wabaDbId: string,
): Promise<{ accessToken: string; metaId: string } | null> {
  const waba = await db("waba").where({ id: wabaDbId }).first();

  if (!waba) {
    return null;
  }

  if (waba?.appId) {
    const app = await db("app").where({ id: waba.appId }).first();
    if (app?.accessToken) {
      return { accessToken: app.accessToken, metaId: waba.metaId };
    }
  }

  return null;
}

export default async function saSubscribe({
  wabaId,
  unsubscribe = false,
}: {
  wabaId: string;
  unsubscribe?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const wabaDetails = await getWabaDetails(wabaId);

  if (!wabaDetails) {
    return {
      success: false,
      error:
        "No access token available for this WABA. Please ensure it is linked to an app.",
    };
  }

  const { accessToken, metaId } = wabaDetails;
  const GRAPH_URL = process.env.META_GRAPH_URL!;

  const url = `${GRAPH_URL}/${metaId}/subscribed_apps`;
  const response = await fetch(url, {
    method: unsubscribe ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (data.error) {
    return {
      success: false,
      error: data.error.message || "Unknown error from Meta API",
    };
  }

  return { success: true };
}
