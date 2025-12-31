"use client";

import saDeleteAgent from "@/actions/saDeleteAgent";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

export default function AgentActions({
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
        `Error Deleting Agent: ${
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
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {isDeletingAgent ? <Spinner /> : <MoreHorizontalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <Alert
              destructive
              title={`Delete ${name}`}
              description="This action cannot be undone."
              actionText="Delete"
              onAction={deleteAgent}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete Agent
              </DropdownMenuItem>
            </Alert>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
