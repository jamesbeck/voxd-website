"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteKnowledgeBlock from "@/actions/saDeleteKnowledgeBlock";
import { Trash2Icon } from "lucide-react";

export default function KnowledgeBlockActions({
  blockId,
  blockIndex,
  agentId,
  documentId,
}: {
  blockId: string;
  blockIndex: number;
  agentId: string;
  documentId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteBlock = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteKnowledgeBlock({ blockId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Knowledge Block: ${
          saResponse.error || "There was an error deleting the knowledge block"
        }`
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted Knowledge Block ${blockIndex}`);
    setIsDeleting(false);
    router.push(
      `/admin/agents/${agentId}/documents/${documentId}?tab=knowledge-blocks`
    );
  };

  return (
    <Alert
      destructive
      title={`Delete Knowledge Block ${blockIndex}`}
      description="This action cannot be undone. This knowledge block and its embedding will be permanently deleted."
      actionText="Delete"
      onAction={deleteBlock}
    >
      <Button variant="destructive" size="sm" className="cursor-pointer">
        {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
        Delete
      </Button>
    </Alert>
  );
}
