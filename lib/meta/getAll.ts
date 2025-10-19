import { Page } from "@/types/metaTypes";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!;

// A tiny helper to follow Graph pagination.
async function getAll<T>(url: string, params: Record<string, any>) {
  const out: T[] = [];
  const qs = new URLSearchParams({
    ...params,
    access_token: ACCESS_TOKEN,
  }).toString();
  let next = `${url}?${qs}`;

  // console.log(next);

  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `GET ${next} failed: ${res.status} ${res.statusText} ${text}`
      );
    }
    const json = (await res.json()) as Page<T>;
    out.push(...(json.data || []));
    console.log(json);
    next = json.paging?.next || "";
  }
  return out;
}

export default getAll;
