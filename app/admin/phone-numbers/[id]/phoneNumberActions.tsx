"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  Webhook,
  Trash2Icon,
  RefreshCw,
} from "lucide-react";
import saSetNumberWebhook from "@/lib/meta/saSetNumberWebhook";
import saClearNumberWebhook from "@/lib/meta/saClearNumberWebhook";
import saSyncPhoneNumberWithMeta from "@/actions/saSyncPhoneNumberWithMeta";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {isLoading ? <Spinner /> : <MoreHorizontalIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={syncPhoneNumber} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync with Meta
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setWebhook("Voxd Production")}
            disabled={isLoading}
          >
            <Webhook className="mr-2 h-4 w-4" />
            Set Webhook to Production
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setWebhook("Voxd Development")}
            disabled={isLoading}
          >
            <Webhook className="mr-2 h-4 w-4" />
            Set Webhook to Development
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={clearWebhook}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Clear Webhook
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
