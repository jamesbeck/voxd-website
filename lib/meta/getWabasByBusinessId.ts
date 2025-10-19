import { Waba } from "@/types/metaTypes";
import getAll from "./getAll";

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

async function getWabasByBusinessId(): Promise<Waba[]> {
  // 1) Enumerate WABAs you can access (owned + client)
  const [owned, client] = await Promise.all([
    getAll<Waba>(
      `${GRAPH_URL}/${BUSINESS_ID}/owned_whatsapp_business_accounts`,
      { limit: 100, fields }
    ),
    getAll<Waba>(
      `${GRAPH_URL}/${BUSINESS_ID}/client_whatsapp_business_accounts`,
      { limit: 100, fields }
    ),
  ]);

  const wabas = [...owned, ...client];

  // Sort by name then id for a stable view
  wabas.sort(
    (a, b) =>
      (a.name || "").localeCompare(b.name || "") || a.id.localeCompare(b.id)
  );

  return wabas;
}

export default getWabasByBusinessId;
