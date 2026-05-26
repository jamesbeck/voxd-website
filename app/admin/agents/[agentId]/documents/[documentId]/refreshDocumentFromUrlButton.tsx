"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw } from "lucide-react";
import { saRefreshDocumentFromUrl } from "@/actions/saRefreshDocumentFromUrl";

export default function RefreshDocumentFromUrlButton({
  documentId,
  documentTitle,
  sourceUrl,
}: {
  documentId: string;
  documentTitle: string;
  sourceUrl?: string | null;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const refreshDocument = async () => {
    setIsRefreshing(true);
    const response = await saRefreshDocumentFromUrl({ documentId });

    if (!response.success) {
      toast.error(
        `Error Refreshing Document: ${
          response.error || "There was an error refreshing the document"
        }`,
      );
      setIsRefreshing(false);
      return;
    }

    toast.success(
      `Refreshed ${response.data.blocksCreated} knowledge block${response.data.blocksCreated === 1 ? "" : "s"} from URL`,
    );
    setIsRefreshing(false);
    router.refresh();
  };

  return (
    <Alert
      title="Refresh from URL"
      description={`This will re-fetch ${sourceUrl || "the saved source URL"} for "${documentTitle}" and replace its knowledge blocks with freshly imported content.`}
      actionText="Refresh"
      onAction={refreshDocument}
    >
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh from URL
      </Button>
    </Alert>
  );
}
