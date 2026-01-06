import React from "react";
import getWaba from "@/lib/meta/getWaba";
import PhoneNumberTable from "./phoneNumberTable";
import TemplatesTable from "./templatesTable";
import H1 from "@/components/adminui/H1";
import H2 from "@/components/adminui/H2";
import Container from "@/components/adminui/Container";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default async function Page({
  params,
  searchParams,
}: {
  params: { wabaId: string };
  searchParams: { tab?: string };
}) {
  const { wabaId } = await params;
  const activeTab = (await searchParams).tab || "phone-numbers";

  const waba = await getWaba(wabaId);

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Wabas", href: "/admin/wabas" },
          { label: waba?.name || "WABA Details" },
        ]}
      />
      <H1>{waba?.name || "WABA Details"}</H1>

      <Tabs value={activeTab} className="space-y-2">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="phone-numbers" asChild>
              <Link href={`/admin/wabas/${wabaId}?tab=phone-numbers`}>
                Phone Numbers
              </Link>
            </TabsTrigger>
            <TabsTrigger value="templates" asChild>
              <Link href={`/admin/wabas/${wabaId}?tab=templates`}>
                Templates
              </Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="border-b mb-6" />

        <TabsContent value="phone-numbers">
          <Container>
            <H2>Phone Numbers</H2>
            <PhoneNumberTable wabaId={wabaId} />
          </Container>
        </TabsContent>

        <TabsContent value="templates">
          <Container>
            <H2>Message Templates</H2>
            <p className="text-muted-foreground mb-4">
              WhatsApp message templates registered with this WABA.
            </p>
            <TemplatesTable wabaId={wabaId} />
          </Container>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
