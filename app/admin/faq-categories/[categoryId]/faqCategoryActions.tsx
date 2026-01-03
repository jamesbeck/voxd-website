"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteFaqCategory from "@/actions/saDeleteFaqCategory";
import { Trash2Icon } from "lucide-react";

export default function FaqCategoryActions({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteCategory = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteFaqCategory({ categoryId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Category: ${
          saResponse.error || "There was an error deleting the category"
        }`
      );
      setIsDeleting(false);
      return;
    }

    toast.success(`Successfully deleted ${categoryName}`);
    setIsDeleting(false);
    router.push("/admin/faq-categories");
  };

  return (
    <Alert
      destructive
      title={`Delete ${categoryName}`}
      description="This action cannot be undone. This category will be permanently deleted. Note: You cannot delete a category that has FAQs assigned to it."
      actionText="Delete"
      onAction={deleteCategory}
    >
      <Button variant="destructive" size="sm" className="cursor-pointer">
        {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
        Delete Category
      </Button>
    </Alert>
  );
}
