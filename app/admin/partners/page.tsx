import Link from "next/link";
import H1 from "@/components/adminui/H1";
import PartnersTable from "./partnersTable";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import Container from "@/components/adminui/Container";
import { Button } from "@/components/ui/button";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Partners" },
        ]}
      />
      <H1>Manage Partners</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/partners/new">New Partner</Link>
        </Button>
      </div>

      <PartnersTable />
    </Container>
  );
}
