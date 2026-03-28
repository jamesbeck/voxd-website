"use client";

import saSyncWabaWithMeta from "@/actions/saSyncWabaWithMeta";
import { toast } from "sonner";
import { useState } from "react";
import RecordActions from "@/components/admin/RecordActions";

export default function WabasActions() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncWithMeta = async () => {
    setIsSyncing(true);
    const saResponse = await saSyncWabaWithMeta({});

    if (!saResponse.success) {
      toast.error(
        `Error Syncing: ${
          saResponse.error || "There was an error syncing with Meta"
        }`,
      );
      setIsSyncing(false);
      return;
    }
    // If successful
    toast.success(`Successfully synced`);
    setIsSyncing(false);
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <RecordActions
        buttons={[
          {
            label: "Sync with Meta",
            loading: isSyncing,
            onClick: syncWithMeta,
          },
        ]}
      />
    </div>
  );
}
