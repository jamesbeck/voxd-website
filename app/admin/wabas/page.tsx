import React from "react";
import getWabasByBusinessId from "@/lib/meta/getWabasByBusinessId";
import WabaCard from "@/components/admin/wabaCard";
import WabasTable from "../wabasTable";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { notFound } from "next/navigation";
import WabasActions from "./WabasActions";
import Container from "@/components/adminui/Container";
import H1 from "@/components/adminui/H1";
import { BreadcrumbSetter } from "@/components/admin/BreadcrumbSetter";

export default async function Page() {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.admin) notFound();

  const wabas = await getWabasByBusinessId();

  return (
    <Container>
      <BreadcrumbSetter
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Wabas" }]}
      />

      <H1 className="text-2xl font-semibold mb-4">
        WhatsApp Business Accounts
      </H1>

      <WabasActions />

      <WabasTable />

      {wabas.length === 0 ? (
        <div className="rounded-lg border p-4">No WABAs found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {wabas.map((w) => (
            <WabaCard key={w.id} waba={w} />
          ))}
        </div>
      )}
    </Container>
  );
}
