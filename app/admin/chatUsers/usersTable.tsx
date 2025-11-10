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
      // format: (value) => value || "",
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
            <Link
              key={agent.id}
              href={`/admin/agents/${agent.id}`}
              className="underline"
            >
              {agent.niceName}
            </Link>
          );
        });

        return <div className="flex flex-col gap-1">{agentLinks}</div>;
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
