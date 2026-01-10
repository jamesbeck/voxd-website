import React from "react";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import OrganisationsTable from "./organisationsTable";
import NewOrganisationButton from "@/components/admin/NewOrganisationButton";

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

      <div className="flex justify-end mb-4">
        <NewOrganisationButton />
      </div>

      <OrganisationsTable />
    </Container>
  );
}
