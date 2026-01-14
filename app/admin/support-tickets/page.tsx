import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import SupportTicketsTable from "./supportTicketsTable";
import { Flag, Info } from "lucide-react";

export default async function Page() {
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

      <SupportTicketsTable />
    </Container>
  );
}
