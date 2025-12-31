"use client";

import { format, formatDistance } from "date-fns";
import saGetUserTableData from "@/actions/saGetChatUserTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const usersTable = () => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
      format: (row: any) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/chatUsers/${row.id}`}>{row.name}</Link>
        </Button>
      ),
    },
    {
      label: "Number",
      name: "number",
      sort: true,
      // format: (value) => value || "",
    },
    {
      label: "Agents",
      name: "agents",
      format: (row: any) => {
        const agentLinks = row.agents.map((agent: any) => {
          return (
            <Button key={agent.id} asChild size="sm" variant="outline">
              <Link href={`/admin/agents/${agent.id}`}>{agent.niceName}</Link>
            </Button>
          );
        });

        return (
          <div className="flex flex-col gap-1 items-start">{agentLinks}</div>
        );
      },
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
      label: "Cost",
      name: "totalCost",
      sort: true,
      format: (row: any) => `$${row.totalCost.toFixed(4)}`,
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
