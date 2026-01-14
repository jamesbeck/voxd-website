"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetDocumentTableData from "@/actions/saGetDocumentTableData";
import { Badge } from "@/components/ui/badge";

const DocumentsTable = ({ agentId }: { agentId: string }) => {
  const columns = [
    {
      label: "Title",
      name: "title",
      sort: true,
    },
    {
      label: "Description",
      name: "description",
      sort: true,
      format: (row: any) =>
        row.description
          ? row.description.length > 50
            ? `${row.description.substring(0, 50)}...`
            : row.description
          : "-",
    },
    {
      label: "Source Type",
      name: "sourceType",
      sort: true,
      format: (row: any) => row.sourceType || "-",
    },
    {
      label: "Blocks",
      name: "blockCount",
      sort: true,
    },
    {
      label: "Enabled",
      name: "enabled",
      sort: true,
      format: (row: any) => (
        <Badge className={row.enabled ? "bg-green-500" : "bg-gray-500"}>
          {row.enabled ? "Yes" : "No"}
        </Badge>
      ),
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
      getData={saGetDocumentTableData}
      getDataParams={{ agentId }}
      columns={columns}
      actions={(row: any) => {
        return (
          <Button asChild size={"sm"}>
            <Link href={`/admin/agents/${agentId}/documents/${row.id}`}>
              View
            </Link>
          </Button>
        );
      }}
    />
  );
};

export default DocumentsTable;
