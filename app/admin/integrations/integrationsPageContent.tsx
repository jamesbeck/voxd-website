"use client";

import { useState } from "react";
import NewIntegrationForm from "./newIntegrationForm";
import IntegrationsTable from "./integrationsTable";

export default function IntegrationsPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <NewIntegrationForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      <IntegrationsTable key={refreshKey} />
    </>
  );
}
