"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetCustomerTableData from "@/actions/saGetCustomerTableData";

const CustomersTable = () => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
      linkTo: (row: any) => `/admin/customers/${row.id}`,
      format: (row: any) => row.name || "",
    },
    {
      label: "Agents",
      name: "agentCount",
      sort: true,
      // format: (value: string) => value || "",}
    },
    {
      label: "Admin Users",
      name: "userCount",
      sort: true,
      // format: (value: string) => value || "",}
    },
  ];

  const actions = (row: any) => {
    return (
      <Button asChild size={"sm"}>
        <Link href={`/admin/customers/${row.id}`}>View</Link>
      </Button>
    );
  };

  return (
    <DataTable
      getData={saGetCustomerTableData}
      columns={columns}
      actions={actions}
    />
  );
};

export default CustomersTable;
