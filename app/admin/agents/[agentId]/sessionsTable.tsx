"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetSessionTableData from "@/actions/saGetSessionsTableData";

const SessionsTable = ({ agentId }: { agentId: string }) => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
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
              "dd/MM/yyyy HH:mm"
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
              new Date()
            )})`
          : "",
    },
    {
      label: "Messages",
      name: "messageCount",
      sort: true,
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
            <Button asChild size={"sm"}>
              <Link href={`/admin/sessions/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default SessionsTable;
