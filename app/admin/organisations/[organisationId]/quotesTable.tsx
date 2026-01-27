"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import saGetQuoteTableData from "@/actions/saGetQuoteTableData";
import { format } from "date-fns";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Draft":
      return <Badge variant="secondary">{status}</Badge>;
    case "Sent to Voxd for Cost Pricing":
      return (
        <Badge className="bg-amber-500 text-white border-transparent">
          Awaiting Pricing
        </Badge>
      );
    case "Cost Pricing Received from Voxd":
      return (
        <Badge className="bg-blue-500 text-white border-transparent">
          Pricing Received
        </Badge>
      );
    case "With Client":
      return (
        <Badge className="bg-purple-500 text-white border-transparent">
          With Client
        </Badge>
      );
    case "Closed":
      return (
        <Badge className="bg-green-600 text-white border-transparent">
          Closed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || "-"}</Badge>;
  }
};

const QuotesTable = ({ organisationId }: { organisationId: string }) => {
  const columns = [
    {
      label: "Title",
      name: "title",
      sort: true,
      linkTo: (row: any) => `/admin/quotes/${row.id}`,
      format: (row: any) => row.title || "",
    },
    {
      label: "Stage",
      name: "status",
      sort: true,
      format: (row: any) => getStatusBadge(row.status),
    },
    {
      label: "Created At",
      name: "createdAt",
      sort: true,
      format: (row: any) => format(new Date(row.createdAt), "dd/MM/yyyy") || "",
    },
    {
      label: "Next Action Date",
      name: "nextActionDate",
      sort: true,
      format: (row: any) =>
        row.nextActionDate
          ? format(new Date(row.nextActionDate), "dd/MM/yyyy")
          : "-",
    },
    {
      label: "Organisation",
      name: "organisationName",
      sort: true,
      linkTo: (row: any) => `/admin/organisations/${row.organisationId}`,
      // format: (value: string) => value || "",}
    },
  ];

  const actions = (row: any) => {
    return (
      <Button asChild size={"sm"}>
        <Link href={`/admin/quotes/${row.id}`}>View</Link>
      </Button>
    );
  };

  return (
    <DataTable
      getData={saGetQuoteTableData}
      getDataParams={{ organisationId }}
      columns={columns}
      actions={actions}
    />
  );
};

export default QuotesTable;
