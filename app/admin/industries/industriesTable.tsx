"use client";

import DataTable from "@/components/adminui/Table";
import saGetIndustryTableData from "@/actions/saGetIndustryTableData";
import TableActions from "@/components/admin/TableActions";

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
      actions={(row: any) => (
        <TableActions href={`/admin/industries/${row.id}`} />
      )}
    />
  );
};

export default IndustriesTable;
