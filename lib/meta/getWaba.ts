import { Waba } from "./types";
import getAll from "./getAll";
import { env } from "process";
import getNumber from "./getPhoneNumber";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!;
const BUSINESS_ID = process.env.META_IO_SHIELD_BUSINESS_ID!;
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

async function getWaba(id: string): Promise<Waba> {
  const qs = new URLSearchParams({
    fields,
    access_token: ACCESS_TOKEN,
  }).toString();

  const url = `${GRAPH_URL}/${id}/?${qs}`;

  const res = await fetch(url, { cache: "no-store" });

  const json = await res.json();

  return json;
}

export default getWaba;
