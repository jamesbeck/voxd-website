"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import { saRegenerateDocumentEmbeddings } from "@/actions/saRegenerateDocumentEmbeddings";
import { RefreshCw } from "lucide-react";

export default function RegenerateEmbeddingsButton({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  const regenerateEmbeddings = async () => {
    setIsRegenerating(true);
    const saResponse = await saRegenerateDocumentEmbeddings({ documentId });

    if (!saResponse.success) {
      toast.error(
        `Error Regenerating Embeddings: ${
          saResponse.error || "There was an error regenerating embeddings"
        }`,
      );
      setIsRegenerating(false);
      return;
    }

    const { successCount, errorCount, totalBlocks } = saResponse.data;

    if (errorCount > 0) {
      toast.warning(
        `Regenerated ${successCount}/${totalBlocks} embeddings. ${errorCount} failed.`,
      );
    } else {
      toast.success(
        `Successfully regenerated ${successCount} embedding${successCount !== 1 ? "s" : ""}`,
      );
    }

    setIsRegenerating(false);
    router.refresh();
  };

  return (
    <Alert
      title="Regenerate Embeddings"
      description={`This will regenerate embeddings for all knowledge blocks in "${documentTitle}". This may take a moment and will use API credits.`}
      actionText="Regenerate"
      onAction={regenerateEmbeddings}
    >
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        disabled={isRegenerating}
      >
        {isRegenerating ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Regenerate Embeddings
      </Button>
    </Alert>
  );
}
