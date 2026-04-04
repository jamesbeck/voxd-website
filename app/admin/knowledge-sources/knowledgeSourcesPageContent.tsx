"use client";

import { useState } from "react";
import NewKnowledgeSourceForm from "./newKnowledgeSourceForm";
import KnowledgeSourcesTable from "./knowledgeSourcesTable";

export default function KnowledgeSourcesPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <NewKnowledgeSourceForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      <KnowledgeSourcesTable key={refreshKey} />
    </>
  );
}
