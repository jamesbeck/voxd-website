import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import SupportTicketsTable from "./supportTicketsTable";
import { Flag, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import SupportTicketsActions from "./supportTicketsActions";

export default async function Page({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const activeTab = (await searchParams).tab || "open";
  const accessToken = await verifyAccessToken();

  // Determine the label for the awaiting tab
  const awaitingLabel =
    !accessToken.partner &&
    !accessToken.superAdmin &&
    accessToken.organisationName
      ? `Waiting on ${accessToken.organisationName}`
      : "Waiting on Client";

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Support Tickets" },
        ]}
      />
      <H1>Support Tickets</H1>

      <Tabs value={activeTab} className="space-y-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="open" asChild>
              <Link href="/admin/support-tickets?tab=open">Open Tickets</Link>
            </TabsTrigger>
            <TabsTrigger value="awaiting" asChild>
              <Link href="/admin/support-tickets?tab=awaiting">
                {awaitingLabel}
              </Link>
            </TabsTrigger>
            <TabsTrigger value="closed" asChild>
              <Link href="/admin/support-tickets?tab=closed">
                Closed Tickets
              </Link>
            </TabsTrigger>
            <TabsTrigger value="backlog" asChild>
              <Link href="/admin/support-tickets?tab=backlog">Back Log</Link>
            </TabsTrigger>
          </TabsList>

          <SupportTicketsActions />
        </div>

        <TabsContent value="open">
          <SupportTicketsTable statusFilter="open" />
        </TabsContent>

        <TabsContent value="awaiting">
          <SupportTicketsTable statusFilter="awaiting" />
        </TabsContent>

        <TabsContent value="closed">
          <SupportTicketsTable statusFilter="closed" />
        </TabsContent>

        <TabsContent value="backlog">
          <SupportTicketsTable statusFilter="backlog" />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
