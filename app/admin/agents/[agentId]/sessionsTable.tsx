"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetSessionTableData from "@/actions/saGetSessionsTableData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SessionsTable = ({
  agentId,
  superAdmin,
}: {
  agentId: string;
  superAdmin: boolean;
}) => {
  const columns = [
    {
      label: "Type",
      name: "sessionType",
      sort: true,
      format: (row: any) => (
        <Badge
          className={cn(
            row.sessionType == "live" ? "bg-green-500" : "bg-red-500",
            "capitalize",
          )}
        >
          {row.sessionType}
        </Badge>
      ),
    },
    {
      label: "Status",
      name: "closedAt",
      sort: true,
      format: (row: any) => {
        let status = "Active";
        let color = "bg-green-500";
        if (row.closedAt) {
          status = "Closed";
          color = "bg-gray-500";
        } else if (row.paused) {
          status = "Paused";
          color = "bg-yellow-500";
        }
        const badge = <Badge className={color}>{status}</Badge>;
        if (row.closedAt && row.closedReason) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>{badge}</TooltipTrigger>
              <TooltipContent>{row.closedReason}</TooltipContent>
            </Tooltip>
          );
        }
        return badge;
      },
    },
    {
      label: "Platform",
      name: "platform",
      sort: true,
      format: (row: any) => (
        <Badge
          className={
            row.platform === "whatsapp" ? "bg-green-500" : "bg-gray-500"
          }
        >
          {row.platform === "whatsapp" ? "WA" : "Web"}
        </Badge>
      ),
    },
    {
      label: "Name",
      name: "name",
      sort: true,
      format: (row: any) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/chatUsers/${row.userId}`}>{row.name}</Link>
        </Button>
      ),
    },
    {
      label: "Number",
      name: "number",
      sort: true,
    },
    {
      label: "First Seen",
      name: "firstMessageAt",
      sort: true,
      format: (row: any) =>
        row.firstMessageAt
          ? `${format(
              row.firstMessageAt,
              "dd/MM/yyyy HH:mm",
            )} (${formatDistance(row.firstMessageAt, new Date())})`
          : "",
    },
    {
      label: "Last Seen",
      name: "lastMessageAt",
      sort: true,
      format: (row: any) =>
        row.lastMessageAt
          ? `${format(row.lastMessageAt, "dd/MM/yyyy HH:mm")} (${formatDistance(
              row.lastMessageAt,
              new Date(),
            )})`
          : "",
    },
    {
      label: "Messages",
      name: "messageCount",
      sort: true,
    },
    {
      label: "Cost",
      name: "totalCost",
      sort: true,
      format: (row: any) => `$${row.totalCost.toFixed(4)}`,
    },
  ];

  return (
    <DataTable
      defaultSort={{
        name: "lastMessageAt",
        direction: "desc",
      }}
      getData={saGetSessionTableData}
      getDataParams={{ agentId }}
      columns={columns}
      actions={(row: any) => {
        return (
          <>
            {(row.sessionType != "development" || superAdmin) && (
              <Button asChild size={"sm"}>
                <Link href={`/admin/sessions/${row.id}`}>View</Link>
              </Button>
            )}
          </>
        );
      }}
    />
  );
};

export default SessionsTable;
