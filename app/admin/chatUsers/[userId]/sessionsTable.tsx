"use client";

import DataTable, { Column } from "@/components/adminui/Table";
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
import Alert from "@/components/admin/Alert";
import saEndSession from "@/actions/saEndSession";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { XCircleIcon } from "lucide-react";

const SessionsTable = ({
  userId,
  superAdmin,
}: {
  userId: string;
  superAdmin: boolean;
}) => {
  const router = useRouter();

  const handleCloseSession = async (sessionId: string, agentName: string) => {
    const saResponse = await saEndSession({ sessionId });

    if (!saResponse.success) {
      toast.error(
        `Error Closing Session: ${
          saResponse.error || "There was an error closing the session"
        }`,
      );
      return;
    }

    toast.success(`Successfully closed session for ${agentName}`);
    router.refresh();
  };

  const columns: Column[] = [
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
      label: "Agent",
      name: "agentName",
      sort: true,
      format: (row: any) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/agents/${row.agentId}`}>{row.agentName}</Link>
        </Button>
      ),
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
      getDataParams={{ userId }}
      columns={columns}
      actions={(row: any) => {
        return (
          <div className="flex items-center gap-2">
            {(row.sessionType != "development" || superAdmin) && (
              <Button asChild size="sm">
                <Link href={`/admin/sessions/${row.id}`}>View</Link>
              </Button>
            )}
            {!row.closedAt && (
              <Alert
                destructive
                title="Close Session"
                description="Are you sure you want to close this session? The session will be marked as closed and any further messages from the user will start a brand new session."
                actionText="Close Session"
                onAction={() => handleCloseSession(row.id, row.agentName)}
              >
                <Button size="sm" variant="destructive">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </Alert>
            )}
          </div>
        );
      }}
    />
  );
};

export default SessionsTable;
