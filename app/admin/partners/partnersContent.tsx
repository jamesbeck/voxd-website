"use client";

import { useState } from "react";
import H1 from "@/components/adminui/H1";
import PartnersTable from "./partnersTable";
import PartnersActions from "./partnersActions";

export default function PartnersContent({
  superAdmin,
  children,
}: {
  superAdmin: boolean;
  children?: React.ReactNode;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="flex items-center justify-between">
        <H1 className="border-b-0 pb-0">Manage Partners</H1>
        <div className="flex items-center gap-2">
          {children}
          {superAdmin && (
            <PartnersActions onComplete={() => setRefreshKey((k) => k + 1)} />
          )}
        </div>
      </div>
      <PartnersTable refreshKey={refreshKey} />
    </>
  );
}
