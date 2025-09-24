import Link from "next/link";
import React from "react";
import getWabasByBusinessId from "@/lib/meta/getWabasByBusinessId";
import WabaCard from "@/components/admin/wabaCard";
import getAgents from "@/lib/getAgents";
import WabasTable from "./wabasTable";

const BUSINESS_ID = process.env.META_IO_SHIELD_BUSINESS_ID!; // per your env var

export default async function Page() {
  const wabas = await getWabasByBusinessId();

  // console.dir(wabas, { depth: null });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-4">
        WhatsApp Business Accounts
      </h1>

      <WabasTable wabas={wabas} />

      {wabas.length === 0 ? (
        <div className="rounded-lg border p-4">No WABAs found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {wabas.map((w) => (
            <WabaCard key={w.id} waba={w} />
          ))}
        </div>
      )}
    </main>
  );
}
