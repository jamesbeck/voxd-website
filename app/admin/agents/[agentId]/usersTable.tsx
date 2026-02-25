"use client";

import { format, formatDistance } from "date-fns";
import saGetUserTableData from "@/actions/saGetChatUserTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const usersTable = ({ agentId }: { agentId: string }) => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
      // format: (value) => value || "",
    },
    {
      label: "Number",
      name: "number",
      sort: true,
      // format: (value) => value || "",
    },
    {
      label: "Platform",
      name: "platforms",
      format: (row: any) => (
        <div className="flex gap-1">
          {row.platforms?.includes("whatsapp") && <Badge className="bg-green-500">WA</Badge>}
          {row.platforms?.some((p: string) => p !== "whatsapp") && <Badge className="bg-gray-500">Web</Badge>}
        </div>
      ),
    },
    {
      label: "Sessions",
      name: "sessionCount",
      sort: true,
    },
    {
      label: "Messages",
      name: "messageCount",
      sort: true,
    },
    {
      label: "Last Message",
      name: "lastMessageAt",
      sort: true,
      format: (row: any) =>
        row.lastMessageAt
          ? `${format(row.lastMessageAt, "dd/MM/yyyy HH:mm")} (${formatDistance(
              row.lastMessageAt,
              new Date()
            )})`
          : "Never",
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetUserTableData}
      getDataParams={{ agentId }}
      actions={(row: any) => {
        return (
          <>
            <Button asChild size={"sm"}>
              <Link href={`/admin/chatUsers/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default usersTable;
