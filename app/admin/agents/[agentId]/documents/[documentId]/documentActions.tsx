"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteDocument from "@/actions/saDeleteDocument";
import { CopyIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CloneDocumentDialog from "./CloneDocumentDialog";

export default function DocumentActions({
  documentId,
  documentTitle,
  agentId,
  organisationId,
}: {
  documentId: string;
  documentTitle: string;
  agentId: string;
  organisationId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const router = useRouter();

  const deleteDocument = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteDocument({ documentId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Document: ${
          saResponse.error || "There was an error deleting the document"
        }`,
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {isDeleting ? <Spinner /> : <MoreHorizontalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setCloneDialogOpen(true)}>
              <CopyIcon className="mr-2 h-4 w-4" />
              Clone to Agent
            </DropdownMenuItem>
            <Alert
              destructive
              title={`Delete ${documentTitle}`}
              description="This action cannot be undone. This document and all its knowledge blocks will be permanently deleted."
              actionText="Delete"
              onAction={deleteDocument}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete Document
              </DropdownMenuItem>
            </Alert>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CloneDocumentDialog
        documentId={documentId}
        documentTitle={documentTitle}
        agentId={agentId}
        organisationId={organisationId}
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
      />
    </>
  );
}
