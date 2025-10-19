import Link from "next/link";
import H1 from "@/components/adminui/H1";
import AgentsTable from "./agentsTable";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import { Button } from "@/components/ui/button";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Agents" }]}
      />
      <H1>Manage Agents</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/agents/new">New Agent</Link>
        </Button>
      </div>

      <AgentsTable />
    </Container>
  );
}
