import { PhoneNumber } from "./types";
import getAll from "./getAll";

const GRAPH_URL = process.env.META_GRAPH_URL!;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!;

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

async function getPhoneNumber(id: string): Promise<PhoneNumber> {
  const qs = new URLSearchParams({
    fields,
    access_token: ACCESS_TOKEN,
  }).toString();

  const url = `${GRAPH_URL}/${id}/?${qs}`;

  const res = await fetch(url, { cache: "no-store" });

  const json = await res.json();

  return json;
}

export default getPhoneNumber;
