"use client";

import DataTable from "@/components/adminui/Table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetChunkTableData from "@/actions/saGetChunkTableData";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const ChunksTable = ({
  documentId,
  agentId,
}: {
  documentId: string;
  agentId: string;
}) => {
  const columns = [
    {
      label: "Index",
      name: "chunkIndex",
      sort: true,
    },
    {
      label: "Title Path",
      name: "titlePath",
      sort: true,
      format: (row: any) => row.titlePath || "-",
    },
    {
      label: "Content Preview",
      name: "content",
      sort: false,
      format: (row: any) =>
        row.content
          ? row.content.length > 80
            ? `${row.content.substring(0, 80)}...`
            : row.content
          : "-",
    },
    {
      label: "Tokens",
      name: "tokenCount",
      sort: true,
      format: (row: any) => row.tokenCount || "-",
    },
    {
      label: "Characters",
      name: "characterCount",
      sort: false,
      format: (row: any) => row.content?.length || 0,
    },
    {
      label: "Embedding",
      name: "hasEmbedding",
      sort: false,
      format: (row: any) => (
        <Badge className={row.hasEmbedding ? "bg-green-500" : "bg-red-500"}>
          {row.hasEmbedding ? "Yes" : "No"}
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
        name: "chunkIndex",
        direction: "asc",
      }}
      getData={saGetChunkTableData}
      getDataParams={{ documentId }}
      columns={columns}
      actions={(row: any) => {
        return (
          <Button asChild size={"sm"}>
            <Link
              href={`/admin/agents/${agentId}/documents/${documentId}/chunks/${row.id}`}
            >
              View
            </Link>
          </Button>
        );
      }}
    />
  );
};

export default ChunksTable;
