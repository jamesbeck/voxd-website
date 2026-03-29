"use client";

import { useMemo } from "react";
import DataTable from "@/components/adminui/Table";
import TableFilters from "@/components/adminui/TableFilters";
import Image from "next/image";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";
import saGetAllPartners from "@/actions/saGetAllPartners";
import { useTableFilters } from "@/hooks/useTableFilters";
import { TableFilterConfig } from "@/types/types";
import TableActions from "@/components/admin/TableActions";

interface OrganisationsTableProps {
  isSuperAdmin?: boolean;
  userPartnerId?: string | null;
}

const OrganisationsTable = ({
  isSuperAdmin,
  userPartnerId,
}: OrganisationsTableProps) => {
  // Define filter configuration
  const filterConfig: TableFilterConfig[] = useMemo(
    () => [
      // Partner filter (only for super admins)
      ...(isSuperAdmin
        ? [
            {
              name: "partnerId",
              label: "Partner",
              type: "select" as const,
              // Default to logged-in user's partner
              defaultValue: userPartnerId || "",
              placeholder: "All Partners",
              loadOptions: async () => {
                const result = await saGetAllPartners();
                return result.success && result.data ? result.data : [];
              },
            },
          ]
        : []),
    ],
    [isSuperAdmin, userPartnerId],
  );

  // Use the table filters hook with localStorage persistence
  const {
    values: filterValues,
    setValue: setFilterValue,
    clearAll: clearFilters,
    hasActiveFilters,
    filterKey,
  } = useTableFilters({
    tableId: "admin-organisations",
    filters: filterConfig,
  });

  const columns = [
    {
      label: "Logo",
      name: "logoFileExtension",
      format: (row: any) =>
        row.logoFileExtension ? (
          <div
            className="inline-flex rounded p-1"
            style={
              row.showLogoOnColour
                ? { backgroundColor: row.showLogoOnColour }
                : undefined
            }
          >
            <Image
              src={`https://s3.eu-west-1.wasabisys.com/voxd/organisationLogos/${row.id}.${row.logoFileExtension}`}
              alt={row.name || "Organisation logo"}
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
      name: "adminUserCount",
      sort: true,
      // format: (value: string) => value || "",}
    },
  ];

  const actions = (row: any) => (
    <TableActions href={`/admin/organisations/${row.id}`} />
  );

  const getDataParams = {
    // Add partner filter if set (super admin only - server enforces this)
    ...(filterValues.partnerId
      ? { partnerId: filterValues.partnerId as string }
      : {}),
  };

  return (
    <>
      {filterConfig.length > 0 && (
        <TableFilters
          filters={filterConfig}
          values={filterValues}
          onChange={setFilterValue}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}
      <DataTable
        tableId="admin-organisations"
        key={filterKey}
        getData={saGetOrganisationTableData}
        getDataParams={
          Object.keys(getDataParams).length > 0 ? getDataParams : undefined
        }
        columns={columns}
        actions={actions}
      />
    </>
  );
};

export default OrganisationsTable;
