import Link from "next/link";
import React from "react";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import Container from "@/components/adminui/container";
import H1 from "@/components/adminui/H1";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";
import CustomersTable from "./customersTable";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.partner && !accessToken?.admin) notFound();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers" },
        ]}
      />
      <H1>Customers</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/customers/new">New Customer</Link>
        </Button>
      </div>

      <CustomersTable />
    </Container>
  );
}
