"use client";

import DataTable from "@/components/adminui/Table";
import Image from "next/image";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import TableActions from "@/components/admin/TableActions";

const partnersTable = () => {
  const columns = [
    {
      label: "Logo",
      name: "logoFileExtension",
      format: (row: any) =>
        row.domain && row.logoFileExtension ? (
          <div
            className="inline-flex p-1"
            style={
              row.showLogoOnColour
                ? { backgroundColor: row.showLogoOnColour }
                : undefined
            }
          >
            <Image
              src={`https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${row.domain}.${row.logoFileExtension}`}
              alt={row.name || "Partner logo"}
              width={80}
              height={32}
              className="h-8 w-auto object-contain"
              unoptimized
            />
          </div>
        ) : null,
    },
    {
      label: "Name",
      name: "name",
      sort: true,
    },
    {
      label: "Colour",
      name: "colour",
      format: (row: any) =>
        row.colour ? (
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: `#${row.colour}` }}
            />
            <span className="text-xs text-muted-foreground">#{row.colour}</span>
          </div>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetPartnerTableData}
      actions={(row: any) => (
        <TableActions href={`/admin/partners/${row.id}`} />
      )}
    />
  );
};

export default partnersTable;
