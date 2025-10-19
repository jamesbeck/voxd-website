"use client";

import DataTable from "@/components/adminui/table2";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetFunctionTableData from "@/actions/saGetFunctionTableData";

const FunctionsTable = () => {
  return (
    <DataTable
      getData={saGetFunctionTableData}
      defaultSort={{
        name: "name",
        direction: "asc",
      }}
      columns={[
        {
          label: "Name",
          name: "name",
          sort: true,
        },
        {
          label: "Slug",
          name: "slug",
          sort: true,
        },
        {
          label: "Example Count",
          name: "exampleCount",
          sort: true,
        },
      ]}
      actions={(row: any) => {
        return (
          <>
            <Button className="cursor-pointer" asChild>
              <Link href={`/admin/functions/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default FunctionsTable;
