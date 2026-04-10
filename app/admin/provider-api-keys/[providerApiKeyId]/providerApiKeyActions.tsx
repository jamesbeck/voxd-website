"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import saDeleteProviderApiKey from "@/actions/saDeleteProviderApiKey";
import RecordActions from "@/components/admin/RecordActions";

export default function ProviderApiKeyActions({
  providerApiKeyId,
}: {
  providerApiKeyId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await saDeleteProviderApiKey({ providerApiKeyId });

    if (result.success) {
      toast.success("Provider API key deleted");
      router.push("/admin/provider-api-keys");
    } else {
      toast.error(result.error || "Failed to delete");
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
                label: "Delete",
                icon: <Trash2 />,
                danger: true,
                confirm: {
                  title: "Delete Provider API Key",
                  description:
                    "This will permanently delete this API key. Any agents or partners using it will lose access. This action cannot be undone.",
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
