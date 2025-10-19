"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetIndustryTableData from "@/actions/saGetIndustryTableData";

const IndustriesTable = () => {
  return (
    <DataTable
      getData={saGetIndustryTableData}
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
              <Link href={`/admin/industries/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default IndustriesTable;
