"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import saDeleteFeature from "@/actions/saDeleteFeature";
import RecordActions from "@/components/admin/RecordActions";

export default function FeatureActions({
  featureId,
  title,
}: {
  featureId: string;
  title: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await saDeleteFeature({ id: featureId });

    if (result.success) {
      toast.success("Feature deleted successfully");
      router.push("/admin/features");
    } else {
      toast.error(result.error || "Failed to delete feature");
      setIsDeleting(false);
    }
  };

  return (
    <RecordActions
      dropdown={{
        loading: isDeleting,
        groups: [
          {
            items: [
              {
                label: "Delete Feature",
                icon: <Trash2 />,
                danger: true,
                confirm: {
                  title: "Are you sure?",
                  description: `This will permanently delete the feature "${title}". This action cannot be undone.`,
                  actionText: "Delete",
                  destructive: true,
                  onAction: handleDelete,
                },
              },
            ],
          },
        ],
      }}
    />
  );
}
