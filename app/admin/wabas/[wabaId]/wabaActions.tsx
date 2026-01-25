"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontalIcon, RefreshCw, Link2, Link2Off, AppWindow } from "lucide-react";
import saSyncWabaWithMeta from "@/actions/saSyncWabaWithMeta";
import saSubscribe from "@/lib/meta/saSubscribe";
import saGetAllApps, { App } from "@/actions/saGetAllApps";
import saUpdateWabaApp from "@/actions/saUpdateWabaApp";

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {isLoading ? <Spinner /> : <MoreHorizontalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={syncWaba} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync WABA with Meta
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setChangeAppDialogOpen(true)}
              disabled={isLoading}
            >
              <AppWindow className="mr-2 h-4 w-4" />
              Change Meta App
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSubscribe} disabled={isLoading}>
              <Link2 className="mr-2 h-4 w-4" />
              Subscribe App
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUnsubscribe} disabled={isLoading}>
              <Link2Off className="mr-2 h-4 w-4" />
              Unsubscribe App
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
