"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/adminui/Table";
import saGetQuoteViewTableData from "@/actions/saGetQuoteViewTableData";
import saGetCurrentUserIp from "@/actions/saGetCurrentUserIp";
import saDeleteQuoteViews from "@/actions/saDeleteQuoteViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistance } from "date-fns";

const QuoteViewsTable = ({ quoteId }: { quoteId: string }) => {
  const [currentUserIp, setCurrentUserIp] = useState<string | null>(null);
  const [showOwnViews, setShowOwnViews] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchIp = async () => {
      const ip = await saGetCurrentUserIp();
      setCurrentUserIp(ip);
    };
    fetchIp();
  }, []);

  const handleDeleteViews = async () => {
    setIsDeleting(true);
    const result = await saDeleteQuoteViews({ quoteId });
    setIsDeleting(false);

    if (result.success) {
      toast.success("Views deleted", {
        description: `Successfully deleted ${
          result.data?.deletedCount || 0
        } view(s).`,
      });
      setRefreshKey((prev) => prev + 1);
    } else {
      toast.error("Error", {
        description: result.error || "Failed to delete views",
      });
    }
  };

  return (
    <div className="space-y-4">
      {currentUserIp && (
        <div className="flex justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOwnViews(!showOwnViews)}
              >
                {showOwnViews ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide my views
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show my views
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {showOwnViews
                  ? `Currently showing views from your IP address (${currentUserIp})`
                  : `Currently hiding views from your IP address (${currentUserIp})`}
              </p>
            </TooltipContent>
          </Tooltip>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Views
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all view records for this quote.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteViews}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete All Views"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <DataTable
        key={refreshKey}
        getData={saGetQuoteViewTableData}
        getDataParams={{
          quoteId,
          excludeIpAddress: showOwnViews ? undefined : currentUserIp,
        }}
        defaultSort={{
          name: "datetime",
          direction: "desc",
        }}
        columns={[
          {
            label: "Viewed",
            name: "datetime",
            sort: true,
            format: (row: any) => (
              <div>
                <div>{format(new Date(row.datetime), "dd/MM/yyyy HH:mm")}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistance(new Date(row.datetime), new Date(), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            ),
          },
          {
            label: "Document",
            name: "documentViewed",
            sort: true,
            format: (row: any) => (
              <Badge
                variant={
                  row.documentViewed === "quote" ? "default" : "secondary"
                }
              >
                {row.documentViewed === "quote" ? "Proposal" : "Pitch"}
              </Badge>
            ),
          },
          {
            label: "Browser",
            name: "browser",
            sort: true,
            format: (row: any) => row.browser || "-",
          },
          {
            label: "OS",
            name: "os",
            sort: true,
            format: (row: any) => row.os || "-",
          },
          {
            label: "Device",
            name: "device",
            sort: false,
            format: (row: any) => row.device || "Desktop",
          },
          {
            label: "IP Address",
            name: "ipAddress",
            sort: true,
            format: (row: any) => (
              <span className="font-mono text-xs">{row.ipAddress || "-"}</span>
            ),
          },
        ]}
      />
    </div>
  );
};

export default QuoteViewsTable;
