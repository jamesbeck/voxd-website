"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetAgentTableData from "@/actions/saGetAgentTableData";

const AgentsTable = ({ organisationId }: { organisationId: string }) => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
    },
    {
      label: "Nice Name",
      name: "niceName",
      sort: true,
    },
    {
      label: "Sessions",
      name: "sessionCount",
      sort: true,
      tooltip: "Live sessions only (excludes development)",
    },
    {
      label: "Messages",
      name: "messageCount",
      sort: true,
      tooltip: "Messages from live sessions only (excludes development)",
    },
    {
      label: "Last Message",
      name: "lastMessageAt",
      sort: true,
      tooltip: "Last message from live sessions only (excludes development)",
      format: (row: any) => {
        const value = row.lastMessageAt;
        return value
          ? `${format(value, "dd/MM/yyyy HH:mm")} (${formatDistance(
              value,
              new Date(),
            )})`
          : "Never";
      },
    },
  ];

  const actions = (row: any) => {
    return (
      <Button asChild size={"sm"}>
        <Link href={`/admin/agents/${row.id}`}>View</Link>
      </Button>
    );
  };

  return (
    <DataTable
      columns={columns}
      defaultSort={{
        name: "niceName",
        direction: "asc",
      }}
      actions={actions}
      getData={saGetAgentTableData}
      getDataParams={{ organisationId }}
    />
  );
};

export default AgentsTable;
