"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import RecordActions from "@/components/admin/RecordActions";
import saDeleteDevelopmentSessions from "@/actions/saDeleteDevelopmentSessions";

export default function SessionsActions() {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteDevelopmentSessions = async () => {
    setIsDeleting(true);
    const result = await saDeleteDevelopmentSessions();

    if (!result.success) {
      toast.error(result.error || "Failed to delete development sessions");
      setIsDeleting(false);
      return;
    }

    toast.success(`Deleted ${result.data?.count ?? 0} development session(s)`);
    setIsDeleting(false);
    router.refresh();
  };

  return (
    <RecordActions
      dropdown={{
        loading: isDeleting,
        groups: [
          {
            items: [
              {
                label: "Delete Development Sessions",
                icon: <Trash2Icon />,
                danger: true,
                loading: isDeleting,
                confirm: {
                  title: "Delete All Development Sessions",
                  description:
                    "This will permanently delete all development sessions and their associated messages. This action cannot be undone.",
                  actionText: "Delete",
                  destructive: true,
                  onAction: handleDeleteDevelopmentSessions,
                },
              },
            ],
          },
        ],
      }}
    />
  );
}
