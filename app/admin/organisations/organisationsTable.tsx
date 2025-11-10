"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";

const OrganisationsTable = () => {
  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
      linkTo: (row: any) => `/admin/organisations/${row.id}`,
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
        <Link href={`/admin/organisations/${row.id}`}>View</Link>
      </Button>
    );
  };

  return (
    <DataTable
      getData={saGetOrganisationTableData}
      columns={columns}
      actions={actions}
    />
  );
};

export default OrganisationsTable;
