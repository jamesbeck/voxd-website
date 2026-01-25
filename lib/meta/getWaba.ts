import { Waba } from "@/types/metaTypes";
import db from "@/database/db";

const GRAPH_URL = process.env.META_GRAPH_URL!;

const fields = [
  "id",
  "name",
  "status",
  "ownership_type",
  "business_verification_status",
  "account_review_status",
  "message_template_namespace",
  // "is_shared_with_partners",
  "marketing_messages_lite_api_status",
  "marketing_messages_onboarding_status",
  "country",
  "health_status",
  "currency",
  "timezone_id",
  "is_enabled_for_insights",
  // // "eligible_for_sending_notifications",
  // // "ineligible_for_sending_notifications_reason",
  "on_behalf_of_business_info",
  // "primary_funding_id",
  // "purchase_order_number",
  // "analytics",
  // "link",
  "subscribed_apps",
  "phone_numbers",
].join(",");

/**
 * Get access token for a WABA by its database ID
 */
async function getAccessTokenForWaba(wabaDbId: string): Promise<string | null> {
  const waba = await db("waba").where({ id: wabaDbId }).first();

  if (waba?.appId) {
    const app = await db("app").where({ id: waba.appId }).first();
    if (app?.accessToken) {
      return app.accessToken;
    }
  }

  return null;
}

/**
 * Get WABA details from Meta API
 * @param id - Database ID of the WABA
 */
async function getWaba(id: string): Promise<Waba | null> {
  // First get the WABA from DB to get its metaId and accessToken
  const dbWaba = await db("waba").where({ id }).first();
  if (!dbWaba) {
    return null;
  }

  const accessToken = await getAccessTokenForWaba(id);
  if (!accessToken) {
    throw new Error(
      "No access token available for this WABA. Please ensure it is linked to an app.",
    );
  }

  const qs = new URLSearchParams({
    fields,
    access_token: accessToken,
  }).toString();

  const url = `${GRAPH_URL}/${dbWaba.metaId}/?${qs}`;

  const res = await fetch(url, { cache: "no-store" });

  const json = await res.json();

  return json;
}

export default getWaba;
