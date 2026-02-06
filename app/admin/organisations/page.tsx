import React from "react";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import OrganisationsTable from "./organisationsTable";
import NewOrganisationButton from "@/components/admin/NewOrganisationButton";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  const isSuperAdmin = accessToken?.superAdmin ?? false;
  const userPartnerId = accessToken?.partnerId ?? null;

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

      <OrganisationsTable
        isSuperAdmin={isSuperAdmin}
        userPartnerId={userPartnerId}
      />
    </Container>
  );
}
