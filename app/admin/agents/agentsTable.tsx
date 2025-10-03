"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";

const AgentsTable = ({ agents }: { agents: any }) => {
  return (
    <DataTable
      data={agents}
      defaultSort={[
        {
          id: "name",
          desc: false,
        },
      ]}
      columns={[
        {
          label: "Name",
          name: "name",
          sort: true,
          format: (value) => value || "",
        },
        {
          label: "Nice Name",
          name: "niceName",
          sort: true,
          format: (value) => value || "",
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
          format: (value) =>
            value
              ? `${format(value, "dd/MM/yyyy HH:mm")} (${formatDistance(
                  value,
                  new Date()
                )})`
              : "Never",
        },
      ]}
      actions={(row: any) => {
        return (
          <>
            <Button className="cursor-pointer" asChild>
              <Link href={`/admin/agents/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default AgentsTable;
