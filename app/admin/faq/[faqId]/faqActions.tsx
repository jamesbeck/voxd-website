"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteFaq from "@/actions/saDeleteFaq";
import { Trash2Icon } from "lucide-react";

export default function FaqActions({ faqId }: { faqId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteFaq = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteFaq({ faqId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting FAQ: ${
          saResponse.error || "There was an error deleting the FAQ"
        }`
      );
      setIsDeleting(false);
      return;
    }

    toast.success("Successfully deleted FAQ");
    setIsDeleting(false);
    router.push("/admin/faq");
  };

  return (
    <Alert
      destructive
      title="Delete FAQ"
      description="This action cannot be undone. This FAQ will be permanently deleted."
      actionText="Delete"
      onAction={deleteFaq}
    >
      <Button variant="destructive" size="sm" className="cursor-pointer">
        {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
        Delete FAQ
      </Button>
    </Alert>
  );
}
