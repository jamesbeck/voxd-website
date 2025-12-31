"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteChunk from "@/actions/saDeleteChunk";
import { Trash2Icon } from "lucide-react";

export default function ChunkActions({
  chunkId,
  chunkIndex,
  agentId,
  documentId,
}: {
  chunkId: string;
  chunkIndex: number;
  agentId: string;
  documentId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteChunk = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteChunk({ chunkId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Chunk: ${
          saResponse.error || "There was an error deleting the chunk"
        }`
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted Chunk ${chunkIndex}`);
    setIsDeleting(false);
    router.push(`/admin/agents/${agentId}/documents/${documentId}?tab=chunks`);
  };

  return (
    <Alert
      destructive
      title={`Delete Chunk ${chunkIndex}`}
      description="This action cannot be undone. This chunk and its embedding will be permanently deleted."
      actionText="Delete"
      onAction={deleteChunk}
    >
      <Button variant="destructive" size="sm" className="cursor-pointer">
        {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
        Delete Chunk
      </Button>
    </Alert>
  );
}
