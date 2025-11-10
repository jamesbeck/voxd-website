"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetQuoteTableData from "@/actions/saGetQuoteTableData";

const QuotesTable = () => {
  const columns = [
    {
      label: "Title",
      name: "title",
      sort: true,
      linkTo: (row: any) => `/admin/quotes/${row.id}`,
      format: (row: any) => row.title || "",
    },
    {
      label: "Organisation",
      name: "organisationName",
      sort: true,
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
      columns={columns}
      actions={actions}
    />
  );
};

export default QuotesTable;
