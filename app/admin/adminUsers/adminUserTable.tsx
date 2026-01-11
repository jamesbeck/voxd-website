"use client";

import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
          <Button variant={"outline"} size="sm" asChild={true}>
            <Link href={`/admin/organisations/${row.organisationId}`}>
              {row.organisationName}
            </Link>
          </Button>
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
