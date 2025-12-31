"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetPartialPromptTableData from "@/actions/saGetPartialPromptTableData";

const PartialPromptsTable = ({ agentId }: { agentId: string }) => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
    },
    {
      label: "Text",
      name: "text",
      sort: true,
      format: (row: any) =>
        row.text
          ? row.text.length > 80
            ? `${row.text.substring(0, 80)}...`
            : row.text
          : "-",
    },
    {
      label: "Created",
      name: "createdAt",
      sort: true,
      format: (row: any) =>
        row.createdAt
          ? format(new Date(row.createdAt), "dd/MM/yyyy HH:mm")
          : "",
    },
  ];

  return (
    <DataTable
      defaultSort={{
        name: "createdAt",
        direction: "desc",
      }}
      getData={saGetPartialPromptTableData}
      getDataParams={{ agentId }}
      columns={columns}
      actions={(row: any) => {
        return (
          <Button asChild size={"sm"}>
            <Link href={`/admin/agents/${agentId}/partial-prompts/${row.id}`}>
              View
            </Link>
          </Button>
        );
      }}
    />
  );
};

export default PartialPromptsTable;
