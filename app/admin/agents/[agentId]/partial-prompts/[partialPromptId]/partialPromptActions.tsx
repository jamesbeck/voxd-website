"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeletePartialPrompt from "@/actions/saDeletePartialPrompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

export default function PartialPromptActions({
  partialPromptId,
  partialPromptName,
  agentId,
}: {
  partialPromptId: string;
  partialPromptName: string;
  agentId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deletePartialPrompt = async () => {
    setIsDeleting(true);
    const saResponse = await saDeletePartialPrompt({ partialPromptId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Partial Prompt: ${
          saResponse.error || "There was an error deleting the partial prompt"
        }`
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${partialPromptName}`);
    setIsDeleting(false);
    router.push(`/admin/agents/${agentId}?tab=partial-prompts`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {isDeleting ? <Spinner /> : <MoreHorizontalIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <Alert
            destructive
            title={`Delete ${partialPromptName}`}
            description="This action cannot be undone. This partial prompt will be permanently deleted."
            actionText="Delete"
            onAction={deletePartialPrompt}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete Partial Prompt
            </DropdownMenuItem>
          </Alert>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
