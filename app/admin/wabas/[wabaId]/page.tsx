import React from "react";
import getAll from "@/lib/meta/getAll";
import getWaba from "@/lib/meta/getWaba";
import getNumber from "@/lib/meta/getPhoneNumber";
import PhoneNumberTable from "./phoneNumberTable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_PRODUCTION_APP!;
const GRAPH = process.env.META_GRAPH_URL!;

type SubscribedApp = {
  id: string;
  name?: string;
  link?: string;
  namespace?: string;
  app_domains?: string[];
  icon_url?: string;
  category?: string;
  // Additional fields appear as Graph allows them
};

export default async function Page({ params }: { params: { wabaId: string } }) {
  const { wabaId } = await params;

  const waba = await getWaba(wabaId);

  const phoneNumbers = [];
  for (const phoneNumber of waba.phone_numbers?.data || []) {
    phoneNumbers.push(await getNumber(phoneNumber.id));
  }

  console.log(phoneNumbers);

  const apps = await getAll<SubscribedApp>(
    `${GRAPH}/${wabaId}/subscribed_apps`,
    {
      limit: 100,
    }
  );

  console.log(apps);

  // Work out the union of keys (for flexible columns)
  const allKeys = new Set<string>([
    "name",
    "link",
    "namespace",
    "app_domains",
    "category",
    "icon_url",
  ]);
  apps.forEach((a) => Object.keys(a || {}).forEach((k) => allKeys.add(k)));

  // Fixed first column (App ID), then preferred order, then any extras alpha-sorted
  const preferred = [
    "name",
    "link",
    "namespace",
    "app_domains",
    "category",
    "icon_url",
  ];
  const extras = [...allKeys]
    .filter((k) => !["id", ...preferred].includes(k))
    .sort();
  const columns = [...preferred.filter((k) => allKeys.has(k)), ...extras];

  // Sort by name then id
  apps.sort(
    (a, b) =>
      (a.name || "").localeCompare(b.name || "") || a.id.localeCompare(b.id)
  );

  return (
    <main className="mx-auto max-w-7xl p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{waba.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold mb-4">WABA: {waba.name}</h1>

      <PhoneNumberTable phoneNumbers={phoneNumbers} />
    </main>
  );
}
