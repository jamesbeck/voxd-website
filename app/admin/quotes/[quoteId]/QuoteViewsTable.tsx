"use client";

import { useState } from "react";
import DataTable from "@/components/adminui/Table";
import saGetQuoteViewTableData from "@/actions/saGetQuoteViewTableData";
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
  const [showTeamViews, setShowTeamViews] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      <div className="flex justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTeamViews(!showTeamViews)}
            >
              {showTeamViews ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide team views
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show team views
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {showTeamViews
                ? "Currently showing views from your team members"
                : "Currently hiding views from your team members"}
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
      <DataTable
        key={refreshKey}
        getData={saGetQuoteViewTableData}
        getDataParams={{
          quoteId,
          excludePartnerViews: !showTeamViews,
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
            label: "Email",
            name: "loggedInEmail",
            sort: true,
            tooltip:
              "If the user was logged in to the portal, who were they logged in as? You can use this to filter out views from your team or identify existing customers that viewed the quote.",
            format: (row: any) => row.loggedInEmail || "-",
          },
          {
            label: "Location",
            name: "locationData",
            sort: false,
            format: (row: any) => {
              if (!row.locationData) return "-";
              try {
                const location =
                  typeof row.locationData === "string"
                    ? JSON.parse(row.locationData)
                    : row.locationData;

                const parts = [];
                if (location.city) parts.push(location.city);
                if (location.region) parts.push(location.region);
                if (location.country_name) parts.push(location.country_name);

                if (parts.length === 0) return "-";

                return (
                  <div>
                    <div>{parts.join(", ")}</div>
                    {location.org && (
                      <div className="text-xs text-muted-foreground">
                        {location.org}
                      </div>
                    )}
                  </div>
                );
              } catch (e) {
                return "-";
              }
            },
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
