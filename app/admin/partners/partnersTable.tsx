"use client";

import DataTable from "@/components/adminui/Table";
import Image from "next/image";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import TableActions from "@/components/admin/TableActions";
import TableLink from "@/components/adminui/TableLink";

const partnersTable = () => {
  const columns = [
    {
      label: "Logo",
      name: "organisationLogoFileExtension",
      format: (row: any) =>
        row.organisationId && row.organisationLogoFileExtension ? (
          <div
            className="inline-flex p-1"
            style={
              row.organisationShowLogoOnColour
                ? { backgroundColor: row.organisationShowLogoOnColour }
                : undefined
            }
          >
            <Image
              src={`https://s3.${process.env.NEXT_PUBLIC_WASABI_REGION || "eu-west-1"}.wasabisys.com/${process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME || "voxd"}/organisationLogos/${row.organisationId}.${row.organisationLogoFileExtension}`}
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
      name: "organisationPrimaryColour",
      format: (row: any) =>
        row.organisationPrimaryColour ? (
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: row.organisationPrimaryColour }}
            />
            <span className="text-xs text-muted-foreground">
              {row.organisationPrimaryColour}
            </span>
          </div>
        ) : null,
    },
    {
      label: "Organisation",
      name: "organisationName",
      format: (row: any) =>
        row.organisationId && row.organisationName ? (
          <TableLink href={`/admin/organisations/${row.organisationId}`}>
            {row.organisationName}
          </TableLink>
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
