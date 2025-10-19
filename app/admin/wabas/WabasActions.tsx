"use client";

import saSyncWithMeta from "@/actions/saSyncWithMeta";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function WabasActions() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncWithMeta = async () => {
    setIsSyncing(true);
    const saResponse = await saSyncWithMeta();

    if (!saResponse.success) {
      toast.error(
        `Error Syncing: ${
          saResponse.error || "There was an error syncing with Meta"
        }`
      );
      setIsSyncing(false);
      return;
    }
    // If successful
    toast.success(`Successfully synced`);
    setIsSyncing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button className="cursor-pointer" size="sm" onClick={syncWithMeta}>
        {isSyncing ? <Spinner /> : null}
        Sync with Meta
      </Button>
    </div>
  );
}
