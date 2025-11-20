"use client";

import { format, formatDistance } from "date-fns";
import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      label: "Organisations",
      name: "organisations",
      format: (row: any) => {
        const organisationLinks = row.organisations.map(
          (organisation: any, i: number) => {
            return (
              <Button
                key={i}
                variant={"outline"}
                size="sm"
                className="cursor:pointer"
                asChild={true}
              >
                <Link
                  key={organisation.id}
                  href={`/admin/organisations/${organisation.id}`}
                >
                  {organisation.name}
                </Link>
              </Button>
            );
          }
        );

        return <div className="gap-2 flex">{organisationLinks}</div>;
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
