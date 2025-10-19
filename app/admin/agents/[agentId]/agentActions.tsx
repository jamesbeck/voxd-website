"use client";

import saDeleteAgent from "@/actions/saDeleteAgent";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";

export default function UserActions({
  agentId,
  name,
}: {
  agentId: string;
  name: string;
}) {
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);

  const router = useRouter();

  const deleteAgent = async () => {
    setIsDeletingAgent(true);
    const saResponse = await saDeleteAgent({ agentId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting User: ${
          saResponse.error || "There was an error deleting the agent"
        }`
      );
      setIsDeletingAgent(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    setIsDeletingAgent(false);
    router.push("/admin/agents");
  };

  return (
    <div className="flex items-center gap-2">
      <Alert
        destructive
        title={`Delete ${name}`}
        description="This action cannot be undone."
        actionText="Delete"
        onAction={deleteAgent}
      >
        <Button className="cursor-pointer" variant="destructive" size="sm">
          {isDeletingAgent ? <Spinner /> : null}
          Delete {name}
        </Button>
      </Alert>
    </div>
  );
}
