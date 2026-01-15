import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import SupportTicketsTable from "./supportTicketsTable";
import { Flag, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

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

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p>
            To create a new support ticket, navigate to the session containing
            the problematic message and click the{" "}
            <Flag className="h-3.5 w-3.5 inline text-red-500 mx-1" /> flag icon
            next to the message to report the issue.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-4">
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
            <Link href="/admin/support-tickets?tab=closed">Closed Tickets</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <SupportTicketsTable statusFilter="open" />
        </TabsContent>

        <TabsContent value="awaiting">
          <SupportTicketsTable statusFilter="awaiting" />
        </TabsContent>

        <TabsContent value="closed">
          <SupportTicketsTable statusFilter="closed" />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
