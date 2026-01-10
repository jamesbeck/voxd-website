"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetQuoteTableData from "@/actions/saGetQuoteTableData";
import { format } from "date-fns";

const QuotesTable = ({ isSuperAdmin }: { isSuperAdmin?: boolean }) => {
  const columns = [
    {
      label: "Title",
      name: "title",
      sort: true,
      linkTo: (row: any) => `/admin/quotes/${row.id}`,
      format: (row: any) => row.title || "",
    },
    {
      label: "Created At",
      name: "createdAt",
      sort: true,
      format: (row: any) => format(new Date(row.createdAt), "dd/MM/yyyy") || "",
    },
    {
      label: "Organisation",
      name: "organisationName",
      sort: true,
      linkTo: (row: any) => `/admin/organisations/${row.organisationId}`,
      // format: (value: string) => value || "",}
    },
    ...(isSuperAdmin
      ? [
          {
            label: "Partner",
            name: "partnerName",
            sort: true,
            linkTo: (row: any) => `/admin/partners/${row.partnerId}`,
            format: (row: any) => row.partnerName || "-",
          },
        ]
      : []),
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
      columns={columns}
      actions={actions}
    />
  );
};

export default QuotesTable;
