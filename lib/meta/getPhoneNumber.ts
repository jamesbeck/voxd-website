import db from "@/database/db";

const GRAPH_URL = process.env.META_GRAPH_URL!;

const fields = [
  "account_mode",
  "status",
  "display_phone_number",
  "health_status",
  "messaging_limit_tier",
  "name_status",
  "quality_score",
  "verified_name",
  "platform_type",
].join(",");

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
      const app = await db("app").where({ id: waba.appId }).first();
      if (app?.accessToken) {
        return app.accessToken;
      }
    }
  }

  return null;
}

/**
 * Get phone number details from Meta API
 * @param id - Meta ID of the phone number
 */
async function getPhoneNumber(id: string) {
  const accessToken = await getAccessTokenForPhoneNumberMetaId(id);
  if (!accessToken) {
    throw new Error(
      "No access token available for this phone number. Please ensure it is linked to an app via its WABA.",
    );
  }

  const qs = new URLSearchParams({
    fields,
    access_token: accessToken,
  }).toString();

  const url = `${GRAPH_URL}/${id}/?${qs}`;

  const res = await fetch(url, { cache: "no-store" });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));

  return json;
}

export default getPhoneNumber;
