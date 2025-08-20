// Next.js 15 (App Router) — Server Component
// Lists all accessible WABAs (owned + client) with detailed fields (incl. status).
// Numbers are intentionally excluded.

import Link from "next/link";
import React from "react";

const GRAPH_VERSION = "v23.0";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
const BUSINESS_ID = process.env.META_IO_SHIELD_BUSINESS_ID!; // per your env var
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

if (!ACCESS_TOKEN || !BUSINESS_ID) {
  // This will surface a friendly error in dev if env not set
  console.warn("Missing META_ACCESS_TOKEN or META_IO_SHIELD_BUSINESS_ID");
}

type Page<T> = { data: T[]; paging?: { next?: string } };

// A tiny helper to follow Graph pagination.
async function getAll<T>(url: string, params: Record<string, any>) {
  const out: T[] = [];
  const qs = new URLSearchParams({
    ...params,
    access_token: ACCESS_TOKEN,
  }).toString();
  let next = `${url}?${qs}`;

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
    next = json.paging?.next || "";
  }
  return out;
}

// Minimal WABA shape we’ll render. We request a broad set of fields; Graph will omit any you’re not permitted to see.
type Waba = {
  id: string;
  name?: string;
  status?: string; // e.g. ACTIVE
  account_review_status?: "PENDING" | "APPROVED" | "REJECTED";
  message_template_namespace?: string;
  currency?: string;
  timezone_id?: string;
  eligible_for_sending_notifications?: boolean;
  ineligible_for_sending_notifications_reason?: string | null;
  on_behalf_of_business_info?: { name: string };
  primary_funding_id?: string;
  purchase_order_number?: string;
  analytics?: unknown;
  subscribed_apps?: {
    data?: { id: string; name?: string; link?: string }[];
  } | null; // via field expansion
};

async function listAllWabas(): Promise<Waba[]> {
  // 1) Enumerate WABAs you can access (owned + client)
  const [owned, client] = await Promise.all([
    getAll<{ id: string; name?: string }>(
      `${GRAPH}/${BUSINESS_ID}/owned_whatsapp_business_accounts`,
      { limit: 100 }
    ),
    getAll<{ id: string; name?: string }>(
      `${GRAPH}/${BUSINESS_ID}/client_whatsapp_business_accounts`,
      { limit: 100 }
    ),
  ]);

  const unique = new Map<string, { id: string; name?: string }>();
  [...owned, ...client].forEach((w) => unique.set(w.id, w));

  const ids = [...unique.values()].map((w) => w.id);
  if (ids.length === 0) return [];

  // 2) Fetch detailed fields for each WABA (including status) using field expansion
  //    (We also pull subscribed_apps via fields to avoid a second pass over the edge.)
  const fields = [
    "id",
    "name",
    "status",
    "account_review_status",
    "message_template_namespace",
    "currency",
    // "timezone_id",
    // // "eligible_for_sending_notifications",
    // // "ineligible_for_sending_notifications_reason",
    "on_behalf_of_business_info",
    // "primary_funding_id",
    // "purchase_order_number",
    // "analytics",
    // "subscribed_apps.limit(100){id,name,link}",
  ].join(",");

  // Graph doesn’t support bulk-by-IDs here, so fetch per-ID in parallel (bounded by Promise.all).
  const detailed = await Promise.all(
    ids.map(async (id) => {
      const url = `${GRAPH}/${id}`;
      const qs = new URLSearchParams({
        fields,
        access_token: ACCESS_TOKEN,
      }).toString();
      const res = await fetch(`${url}?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        console.log(res);

        // Swallow individual errors and keep the list robust
        console.warn(
          `Failed to fetch WABA ${id}: ${res.status} ${res.statusText}`
        );
        return { id, name: unique.get(id)?.name } as Waba;
      }
      return (await res.json()) as Waba;
    })
  );

  // Sort by name then id for a stable view
  detailed.sort(
    (a, b) =>
      (a.name || "").localeCompare(b.name || "") || a.id.localeCompare(b.id)
  );
  return detailed;
}

export default async function Page() {
  try {
    const wabas = await listAllWabas();

    console.log(wabas);

    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold mb-4">
          WhatsApp Business Accounts
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Listing all WABAs available to this Business ({BUSINESS_ID}) with
          detailed fields, including status. Numbers are intentionally excluded.
        </p>

        {wabas.length === 0 ? (
          <div className="rounded-lg border p-4">No WABAs found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">WABA ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Review Status</th>
                  <th className="p-3">Template Namespace</th>
                  <th className="p-3">Currency</th>
                  <th className="p-3">Timezone</th>
                  <th className="p-3">Eligible for Notifications</th>
                  <th className="p-3">Subscribed Apps (IDs)</th>
                  <th className="p-3">On Behalf of Business Info</th>
                </tr>
              </thead>
              <tbody>
                {wabas.map((w) => {
                  const apps = w.subscribed_apps?.data ?? [];
                  return (
                    <tr key={w.id} className="border-t">
                      <td className="p-3">
                        <Link href={`/admin/${w.id}`}>{w.name ?? "—"}</Link>
                      </td>
                      <td className="p-3 font-mono">{w.id}</td>
                      <td className="p-3">{w.status ?? "—"}</td>
                      <td className="p-3">{w.account_review_status ?? "—"}</td>
                      <td className="p-3">
                        {w.message_template_namespace ?? "—"}
                      </td>
                      <td className="p-3">{w.currency ?? "—"}</td>
                      <td className="p-3">{w.timezone_id ?? "—"}</td>
                      <td className="p-3">
                        {typeof w.eligible_for_sending_notifications ===
                        "boolean"
                          ? w.eligible_for_sending_notifications
                            ? "Yes"
                            : "No"
                          : "—"}
                      </td>
                      <td className="p-3">
                        {apps.length ? apps.map((a) => a.id).join(", ") : "—"}
                      </td>
                      <td className="p-3">
                        {w.on_behalf_of_business_info?.name ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-neutral-500">
          Graph API: {GRAPH_VERSION}
        </div>
      </main>
    );
  } catch (err: any) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-4">
          WhatsApp Business Accounts
        </h1>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-medium mb-2">Failed to load WABAs</p>
          <pre className="whitespace-pre-wrap text-xs opacity-80">
            {String(err?.message || err)}
          </pre>
        </div>
      </main>
    );
  }
}
