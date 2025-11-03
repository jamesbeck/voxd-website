"use client";

import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";

const partnersTable = () => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
      // format: (value) => value || "",
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetPartnerTableData}
      actions={(row: any) => {
        return (
          <>
            <Button asChild size={"sm"}>
              <Link href={`/admin/partners/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default partnersTable;
