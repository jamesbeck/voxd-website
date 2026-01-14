"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteDocument from "@/actions/saDeleteDocument";
import { Trash2Icon } from "lucide-react";

export default function DocumentActions({
  documentId,
  documentTitle,
  agentId,
}: {
  documentId: string;
  documentTitle: string;
  agentId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteDocument = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteDocument({ documentId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Document: ${
          saResponse.error || "There was an error deleting the document"
        }`
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${documentTitle}`);
    setIsDeleting(false);
    router.push(`/admin/agents/${agentId}?tab=knowledge`);
  };

  return (
    <Alert
      destructive
      title={`Delete ${documentTitle}`}
      description="This action cannot be undone. This document and all its knowledge blocks will be permanently deleted."
      actionText="Delete"
      onAction={deleteDocument}
    >
      <Button variant="destructive" size="sm" className="cursor-pointer">
        {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
        Delete Document
      </Button>
    </Alert>
  );
}
