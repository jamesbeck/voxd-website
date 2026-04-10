"use client";

import DataTable from "@/components/adminui/Table";
import Image from "next/image";
import Link from "next/link";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import TableActions from "@/components/admin/TableActions";
import TableLink from "@/components/adminui/TableLink";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

const partnersTable = ({ refreshKey }: { refreshKey?: number } = {}) => {
  const columns = [
    {
      label: "Branding",
      name: "organisationLogoFileExtension",
      format: (row: any) => (
        <div className="flex items-center gap-3" style={{ minWidth: 100 }}>
          <Link href={`/admin/partners/${row.id}`}>
            {row.organisationId && row.organisationLogoFileExtension ? (
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
            ) : null}
          </Link>
          {row.organisationPrimaryColour ? (
            <div
              className="h-6 w-6 shrink-0 rounded border"
              style={{ backgroundColor: row.organisationPrimaryColour }}
              title={row.organisationPrimaryColour}
            />
          ) : null}
        </div>
      ),
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
    {
      label: "Domain",
      name: "domain",
      sort: true,
      format: (row: any) =>
        row.domain ? (
          <div className="flex items-center gap-2">
            {row.domainVerified ? (
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 shrink-0 text-red-500" />
            )}
            <span>{row.domain}</span>
          </div>
        ) : null,
    },
    {
      label: "Core",
      name: "coreDomain",
      format: (row: any) =>
        row.coreDomain ? (
          <div className="flex items-center gap-2">
            {row.coreDomainVerified ? (
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 shrink-0 text-red-500" />
            )}
            <span>{row.coreDomain}</span>
          </div>
        ) : null,
    },
    {
      label: "Email",
      name: "sendEmailFromDomain",
      format: (row: any) =>
        row.sendEmailFromDomain ? (
          <div className="flex items-center gap-2">
            {row.sendEmailFromDomainVerified ? (
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 shrink-0 text-red-500" />
            )}
            <span>@{row.sendEmailFromDomain}</span>
          </div>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetPartnerTableData}
      getDataParams={{ refreshKey }}
      actions={(row: any) => (
        <TableActions href={`/admin/partners/${row.id}`} />
      )}
    />
  );
};

export default partnersTable;
