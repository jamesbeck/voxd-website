"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Webhook, Trash2Icon, RefreshCw } from "lucide-react";
import saSetNumberWebhook from "@/lib/meta/saSetNumberWebhook";
import saClearNumberWebhook from "@/lib/meta/saClearNumberWebhook";
import saSyncPhoneNumberWithMeta from "@/actions/saSyncPhoneNumberWithMeta";
import RecordActions from "@/components/admin/RecordActions";

export default function PhoneNumberActions({
  phoneNumberId,
  metaId,
}: {
  phoneNumberId: string;
  metaId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const setWebhook = async (webhookName: string) => {
    setIsLoading(true);
    try {
      const result = await saSetNumberWebhook({
        numberId: metaId,
        webhookName,
      });

      if (result.success === false || result.error) {
        toast.error(
          `Error setting webhook: ${result.error?.message || "Unknown error"}`,
        );
      } else {
        toast.success(`Successfully set webhook to ${webhookName}`);
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error setting webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  const clearWebhook = async () => {
    setIsLoading(true);
    try {
      const result = await saClearNumberWebhook({
        numberId: metaId,
      });

      if (result.success === false || result.error) {
        toast.error(
          `Error clearing webhook: ${result.error?.message || "Unknown error"}`,
        );
      } else {
        toast.success("Successfully cleared webhook");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error clearing webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  const syncPhoneNumber = async () => {
    setIsLoading(true);
    try {
      const result = await saSyncPhoneNumberWithMeta({
        phoneNumberId,
      });

      if (!result.success) {
        toast.error(
          `Error syncing: ${result.error || "There was an error syncing with Meta"}`,
        );
      } else {
        toast.success("Successfully synced phone number with Meta");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error syncing: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  return (
    <RecordActions
      dropdown={{
        loading: isLoading,
        groups: [
          {
            items: [
              {
                label: "Sync with Meta",
                icon: <RefreshCw />,
                onSelect: syncPhoneNumber,
                disabled: isLoading,
              },
              {
                label: "Set Webhook to Production",
                icon: <Webhook />,
                onSelect: () => setWebhook("Voxd Production"),
                disabled: isLoading,
              },
              {
                label: "Set Webhook to Development",
                icon: <Webhook />,
                onSelect: () => setWebhook("Voxd Development"),
                disabled: isLoading,
              },
              {
                label: "Clear Webhook",
                icon: <Trash2Icon />,
                danger: true,
                onSelect: clearWebhook,
                disabled: isLoading,
              },
            ],
          },
        ],
      }}
    />
  );
}
