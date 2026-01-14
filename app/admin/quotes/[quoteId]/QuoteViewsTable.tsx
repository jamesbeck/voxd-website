"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/adminui/Table";
import saGetQuoteViewTableData from "@/actions/saGetQuoteViewTableData";
import saGetCurrentUserIp from "@/actions/saGetCurrentUserIp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Info } from "lucide-react";
import { format, formatDistance } from "date-fns";

const QuoteViewsTable = ({ quoteId }: { quoteId: string }) => {
  const [currentUserIp, setCurrentUserIp] = useState<string | null>(null);
  const [showOwnViews, setShowOwnViews] = useState(false);

  useEffect(() => {
    const fetchIp = async () => {
      const ip = await saGetCurrentUserIp();
      setCurrentUserIp(ip);
    };
    fetchIp();
  }, []);

  return (
    <div className="space-y-4">
      {currentUserIp && (
        <Alert className="items-center bg-blue-50 border-blue-200 text-blue-800 [&>svg]:text-blue-600">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>
              Views from your IP address ({currentUserIp}) are{" "}
              {showOwnViews ? "shown" : "hidden"}.
            </span>
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
          </AlertDescription>
        </Alert>
      )}
      <DataTable
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
