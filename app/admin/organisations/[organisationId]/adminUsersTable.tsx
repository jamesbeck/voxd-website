"use client";

import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AdminUsersTable = ({ organisationId }: { organisationId: string }) => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
      // format: (value) => value || "",
    },
    {
      label: "Email",
      name: "email",
      sort: true,
      // format: (value) => value || "",
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetAdminUserTableData}
      getDataParams={{ organisationId }}
      actions={(row: any) => {
        return (
          <>
            <Button asChild size={"sm"}>
              <Link href={`/admin/adminUsers/${row.id}`}>View</Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default AdminUsersTable;
