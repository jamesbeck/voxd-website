"use client";

import DataTable from "@/components/adminui/Table";
import saGetProviderApiKeyTableData from "@/actions/saGetProviderApiKeyTableData";
import TableActions from "@/components/admin/TableActions";
import TableLink from "@/components/adminui/TableLink";

function maskKey(key: string) {
  if (!key) return "";
  if (key.length > 12) return `${key.slice(0, 6)}...${key.slice(-4)}`;
  return "***";
}

export default function ProviderApiKeysTable({
  organisationId,
}: {
  organisationId?: string;
}) {
  const columns = [
    {
      label: "Provider",
      name: "providerName",
      sort: true,
    },
    {
      label: "Key",
      name: "key",
      format: (row: any) => (
        <span className="font-mono text-xs">{maskKey(row.key)}</span>
      ),
    },
    {
      label: "Organisation",
      name: "organisationName",
      sort: true,
      format: (row: any) =>
        row.organisationId && row.organisationName ? (
          <TableLink href={`/admin/organisations/${row.organisationId}`}>
            {row.organisationName}
          </TableLink>
        ) : null,
    },
    {
      label: "Created",
      name: "createdAt",
      sort: true,
      format: (row: any) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-GB")
          : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetProviderApiKeyTableData}
      getDataParams={{ organisationId }}
      actions={(row: any) => (
        <TableActions href={`/admin/provider-api-keys/${row.id}`} />
      )}
    />
  );
}
