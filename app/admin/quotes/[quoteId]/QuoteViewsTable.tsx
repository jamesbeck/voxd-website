"use client";

import DataTable from "@/components/adminui/Table";
import saGetQuoteViewTableData from "@/actions/saGetQuoteViewTableData";
import { Badge } from "@/components/ui/badge";
import { format, formatDistance } from "date-fns";

const QuoteViewsTable = ({ quoteId }: { quoteId: string }) => {
  return (
    <DataTable
      getData={saGetQuoteViewTableData}
      getDataParams={{ quoteId }}
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
              variant={row.documentViewed === "quote" ? "default" : "secondary"}
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
  );
};

export default QuoteViewsTable;
