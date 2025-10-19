"use client";

import { format, formatDistance } from "date-fns";
import saGetUserTableData from "@/actions/saGetUserTableData";
import DataTable from "@/components/adminui/table2";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const usersTable = ({ customerId }: { customerId: string }) => {
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
      getDataParams={{ customerId }}
      actions={(row: any) => {
        return (
          <>
            <Button asChild size={"sm"}>
              <Link href={`/admin/users/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default usersTable;
