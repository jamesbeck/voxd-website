"use client";

import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TableLink from "@/components/adminui/TableLink";
import { formatDistanceToNow } from "date-fns";

const adminUsersTable = () => {
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
    {
      label: "Organisation",
      name: "organisationName",
      format: (row: any) => {
        if (!row.organisationId) {
          return <span className="text-muted-foreground">None</span>;
        }
        return (
          <TableLink href={`/admin/organisations/${row.organisationId}`}>
            {row.organisationName}
          </TableLink>
        );
      },
    },
    {
      label: "Last Login",
      name: "lastLogin",
      sort: true,
      format: (row: any) => {
        if (!row.lastLogin) {
          return <span className="text-muted-foreground">Never</span>;
        }
        return formatDistanceToNow(new Date(row.lastLogin), {
          addSuffix: true,
        });
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetAdminUserTableData}
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

export default adminUsersTable;
