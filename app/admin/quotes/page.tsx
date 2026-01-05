import Link from "next/link";
import React from "react";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import BreadcrumbSetter from "@/components/admin/BreadcrumbSetter";
import QuotesTable from "./quotesTable";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.partner && !accessToken?.admin) notFound();

  const isAdmin = accessToken?.admin ?? false;

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Quotes" }]}
      />
      <H1>Quotes</H1>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/quotes/new">New Quote</Link>
        </Button>
      </div>

      <QuotesTable isAdmin={isAdmin} />
    </Container>
  );
}
