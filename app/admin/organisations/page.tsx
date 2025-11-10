import Link from "next/link";
import React from "react";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import OrganisationsTable from "./organisationsTable";
import { Button } from "@/components/ui/button";

export default async function Page() {
  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Organisations" },
        ]}
      />
      <H1>Organisations</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/organisations/new">New Organisation</Link>
        </Button>
      </div>

      <OrganisationsTable />
    </Container>
  );
}
