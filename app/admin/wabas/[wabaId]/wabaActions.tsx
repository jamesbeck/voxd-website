"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Link2, Link2Off, AppWindow } from "lucide-react";
import saSyncWabaWithMeta from "@/actions/saSyncWabaWithMeta";
import saSubscribe from "@/lib/meta/saSubscribe";
import saGetAllApps, { App } from "@/actions/saGetAllApps";
import saUpdateWabaApp from "@/actions/saUpdateWabaApp";
import RecordActions from "@/components/admin/RecordActions";

export default function WabaActions({ wabaId }: { wabaId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [changeAppDialogOpen, setChangeAppDialogOpen] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [loadingApps, setLoadingApps] = useState(false);
  const router = useRouter();

  // Load apps when dialog opens
  useEffect(() => {
    if (changeAppDialogOpen) {
      setLoadingApps(true);
      saGetAllApps().then((result) => {
        if (result.success && result.data) {
          setApps(result.data);
        } else if (!result.success) {
          toast.error(result.error || "Failed to load apps");
        }
        setLoadingApps(false);
      });
    }
  }, [changeAppDialogOpen]);

  const syncWaba = async () => {
    setIsLoading(true);
    try {
      const result = await saSyncWabaWithMeta({ wabaId });

      if (!result.success) {
        toast.error(
          `Error syncing: ${result.error || "There was an error syncing with Meta"}`,
        );
      } else {
        toast.success("Successfully synced WABA with Meta");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error syncing: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const result = await saSubscribe({ wabaId, unsubscribe: false });

      if (!result.success) {
        toast.error(`Error subscribing: ${result.error || "Unknown error"}`);
      } else {
        // Resync WABA with Meta to get updated subscription data
        await saSyncWabaWithMeta({ wabaId });
        toast.success("Successfully subscribed app to WABA");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error subscribing: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const result = await saSubscribe({ wabaId, unsubscribe: true });

      if (!result.success) {
        toast.error(`Error unsubscribing: ${result.error || "Unknown error"}`);
      } else {
        // Resync WABA with Meta to get updated subscription data
        await saSyncWabaWithMeta({ wabaId });
        toast.success("Successfully unsubscribed app from WABA");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error unsubscribing: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  const handleChangeApp = async () => {
    if (!selectedAppId) {
      toast.error("Please select an app");
      return;
    }

    setIsLoading(true);
    try {
      const result = await saUpdateWabaApp({
        wabaId,
        appId: selectedAppId,
      });

      if (!result.success) {
        toast.error(`Error changing app: ${result.error || "Unknown error"}`);
      } else {
        if (result.data?.subscribeError) {
          toast.warning(
            `App changed but subscription failed: ${result.data.subscribeError}`,
          );
        } else {
          toast.success("Successfully changed Meta App and subscribed");
        }
        setChangeAppDialogOpen(false);
        setSelectedAppId("");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        `Error changing app: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
    setIsLoading(false);
  };

  return (
    <>
      <RecordActions
        dropdown={{
          loading: isLoading,
          groups: [
            {
              items: [
                {
                  label: "Sync WABA with Meta",
                  icon: <RefreshCw />,
                  onSelect: syncWaba,
                  disabled: isLoading,
                },
              ],
            },
            {
              items: [
                {
                  label: "Change Meta App",
                  icon: <AppWindow />,
                  onSelect: () => setChangeAppDialogOpen(true),
                  disabled: isLoading,
                },
                {
                  label: "Subscribe App",
                  icon: <Link2 />,
                  onSelect: handleSubscribe,
                  disabled: isLoading,
                },
                {
                  label: "Unsubscribe App",
                  icon: <Link2Off />,
                  onSelect: handleUnsubscribe,
                  disabled: isLoading,
                },
              ],
            },
          ],
        }}
      />

      <Dialog open={changeAppDialogOpen} onOpenChange={setChangeAppDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Meta App</DialogTitle>
            <DialogDescription>
              Select a Meta App to associate with this WABA. The app will be
              automatically subscribed after the change.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingApps ? (
              <div className="flex items-center justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangeAppDialogOpen(false);
                setSelectedAppId("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeApp}
              disabled={isLoading || !selectedAppId}
            >
              {isLoading ? <Spinner /> : "Change App"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
