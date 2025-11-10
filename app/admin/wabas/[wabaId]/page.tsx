import React from "react";
import getWaba from "@/lib/meta/getWaba";
import PhoneNumberTable from "./phoneNumberTable";
import H2 from "@/components/adminui/H2";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";

export default async function Page({ params }: { params: { wabaId: string } }) {
  const { wabaId } = await params;

  const waba = await getWaba(wabaId);

  // const apps = await getAll<SubscribedApp>(
  //   `${GRAPH}/${wabaId}/subscribed_apps`,
  //   {
  //     limit: 100,
  //   }
  // );

  // console.log(apps);

  // Work out the union of keys (for flexible columns)
  // const allKeys = new Set<string>([
  //   "name",
  //   "link",
  //   "namespace",
  //   "app_domains",
  //   "category",
  //   "icon_url",
  // ]);
  // apps.forEach((a) => Object.keys(a || {}).forEach((k) => allKeys.add(k)));

  // // Fixed first column (App ID), then preferred order, then any extras alpha-sorted
  // const preferred = [
  //   "name",
  //   "link",
  //   "namespace",
  //   "app_domains",
  //   "category",
  //   "icon_url",
  // ];
  // const extras = [...allKeys]
  //   .filter((k) => !["id", ...preferred].includes(k))
  //   .sort();
  // const columns = [...preferred.filter((k) => allKeys.has(k)), ...extras];

  // // Sort by name then id
  // apps.sort(
  //   (a, b) =>
  //     (a.name || "").localeCompare(b.name || "") || a.id.localeCompare(b.id)
  // );

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Wabas", href: "/admin/wabas" },
          { label: waba?.name || "WABA Details" },
        ]}
      />
      <H2>Phone Numbers</H2>

      <PhoneNumberTable wabaId={wabaId} />
    </Container>
  );
}
