"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";

const SessionsTable = ({ sessions }: { sessions: any; agentId: string }) => {
  return (
    <DataTable
      data={sessions}
      defaultSort={[
        {
          id: "lastMessageAt",
          desc: true,
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
          label: "Number",
          name: "number",
          sort: true,
        },
        {
          label: "First Seen",
          name: "firstMessageAt",
          sort: true,
          format: (value) =>
            value
              ? `${format(value, "dd/MM/yyyy HH:mm")} (${formatDistance(
                  value,
                  new Date()
                )})`
              : "",
        },
        {
          label: "Last Seen",
          name: "lastMessageAt",
          sort: true,
          format: (value) =>
            value
              ? `${format(value, "dd/MM/yyyy HH:mm")} (${formatDistance(
                  value,
                  new Date()
                )})`
              : "",
        },
        {
          label: "Messages",
          name: "messageCount",
          sort: true,
          format: (value) => value || "",
        },
      ]}
      actions={(row: any) => {
        return (
          <>
            <Button className="cursor-pointer" asChild>
              <Link href={`/admin/sessions/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default SessionsTable;
