"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Function } from "@/types/types";

const FunctionsTable = ({ functions }: { functions: Function[] }) => {
  console.log(functions);

  return (
    <DataTable
      data={functions}
      defaultSort={[
        {
          id: "name",
          desc: false,
        },
      ]}
      columns={[
        {
          label: "Name",
          name: "name",
          sort: true,
          format: (value) => value || "",
        },
        {
          label: "Slug",
          name: "slug",
          sort: true,
          format: (value) => value || "",
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
