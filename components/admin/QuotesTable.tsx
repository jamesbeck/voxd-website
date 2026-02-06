"use client";

import { useMemo } from "react";
import DataTable from "@/components/adminui/Table";
import TableFilters from "@/components/adminui/TableFilters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import saGetQuoteTableData from "@/actions/saGetQuoteTableData";
import saGetPartnerAdminUsers from "@/actions/saGetPartnerAdminUsers";
import saGetAllPartners from "@/actions/saGetAllPartners";
import { useTableFilters } from "@/hooks/useTableFilters";
import { TableFilterConfig } from "@/types/types";
import { format, isToday, isPast, startOfDay } from "date-fns";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Draft":
      return <Badge variant="secondary">{status}</Badge>;
    case "Pitched to Client":
      return (
        <Badge className="bg-cyan-500 text-white border-transparent">
          Pitched to Client
        </Badge>
      );
    case "Sent to Voxd for Cost Pricing":
      return (
        <Badge className="bg-amber-500 text-white border-transparent">
          Awaiting Pricing
        </Badge>
      );
    case "Cost Pricing Received from Voxd":
      return (
        <Badge className="bg-blue-500 text-white border-transparent">
          Pricing Received
        </Badge>
      );
    case "Proposal with Client":
      return (
        <Badge className="bg-purple-500 text-white border-transparent">
          Proposal with Client
        </Badge>
      );
    case "Closed Won":
      return (
        <Badge
          className="border-transparent"
          style={{ backgroundColor: "#16a34a", color: "white" }}
        >
          Closed Won
        </Badge>
      );
    case "Closed Lost":
      return (
        <Badge
          className="border-transparent"
          style={{ backgroundColor: "#dc2626", color: "white" }}
        >
          Closed Lost
        </Badge>
      );
    case "Closed":
      return (
        <Badge className="bg-green-600 text-white border-transparent">
          Closed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || "-"}</Badge>;
  }
};

interface QuotesTableProps {
  organisationId?: string;
  /** Fixed partner filter - when set, hides partner dropdown and always filters by this partner */
  partnerId?: string;
  isSuperAdmin?: boolean;
  userPartnerId?: string | null;
}

const QuotesTable = ({
  organisationId,
  partnerId,
  isSuperAdmin,
  userPartnerId,
}: QuotesTableProps) => {
  // Status filter options
  const statusOptions = [
    { value: "open", label: "Open Quotes" },
    { value: "Draft", label: "Draft" },
    { value: "Pitched to Client", label: "Pitched" },
    { value: "Sent to Voxd for Cost Pricing", label: "Sent to Voxd" },
    { value: "Cost Pricing Received from Voxd", label: "Pricing Received" },
    { value: "Proposal with Client", label: "With Client" },
    { value: "Closed Won", label: "Closed Won" },
    { value: "Closed Lost", label: "Closed Lost" },
    { value: "all", label: "All Quotes" },
  ];

  // Define filter configuration
  const filterConfig: TableFilterConfig[] = useMemo(
    () => [
      // Status filter (always shown)
      {
        name: "statusFilter",
        label: "Status",
        type: "select",
        defaultValue: "open",
        placeholder: "All Statuses",
        options: statusOptions,
      },
      // Partner filter (only for super admins, not on organisation page, not when partnerId prop is set)
      ...(isSuperAdmin && !organisationId && !partnerId
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
      // Owner filter (only if not filtered by organisation)
      ...(!organisationId
        ? [
            {
              name: "ownerId",
              label: "Owner",
              type: "select" as const,
              defaultValue: "",
              placeholder: "All Owners",
              loadOptions: async () => {
                const result = await saGetPartnerAdminUsers();
                return result.success && result.data ? result.data : [];
              },
            },
          ]
        : []),
    ],
    [organisationId, partnerId, isSuperAdmin, userPartnerId]
  );

  // Use the table filters hook with localStorage persistence
  const {
    values: filterValues,
    setValue: setFilterValue,
    clearAll: clearFilters,
    hasActiveFilters,
    filterKey,
  } = useTableFilters({
    tableId: "admin-quotes",
    filters: filterConfig,
  });

  const columns = [
    // Only show Organisation column if not filtered by organisation
    ...(!organisationId
      ? [
          {
            label: "Organisation",
            name: "organisationName",
            sort: true,
            format: (row: any) => {
              const name = row.organisationName || "";
              const displayName = name.length > 40 ? `${name.slice(0, 40)}...` : name;
              const link = (
                <Link
                  href={`/admin/organisations/${row.organisationId}`}
                  className="hover:underline"
                >
                  {displayName}
                </Link>
              );
              if (name.length <= 40) return link;
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {link}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            },
          },
        ]
      : []),
    {
      label: "Title",
      name: "title",
      sort: true,
      linkTo: (row: any) => `/admin/quotes/${row.id}`,
      format: (row: any) => {
        const title = row.title || "";
        if (title.length <= 40) return title;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">{title.slice(0, 40)}...</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      label: "Stage",
      name: "status",
      sort: true,
      format: (row: any) => getStatusBadge(row.status),
    },
    {
      label: "Next Action Date",
      name: "nextActionDate",
      sort: true,
      format: (row: any) => {
        // If no next action text and quote is not closed, show red NONE badge
        if (!row.nextAction) {
          const isClosed =
            row.status === "Closed Won" || row.status === "Closed Lost";
          if (!isClosed) {
            return (
              <Badge
                className="border-transparent"
                style={{ backgroundColor: "#dc2626", color: "white" }}
              >
                NONE
              </Badge>
            );
          }
          return "-";
        }
        if (!row.nextActionDate) return "-";
        const date = new Date(row.nextActionDate);
        const dateStr = format(date, "dd/MM/yyyy");
        const isOverdue = isToday(date) || isPast(startOfDay(date));

        const content = isOverdue ? (
          <Badge
            className="border-transparent"
            style={{ backgroundColor: "#dc2626", color: "white" }}
          >
            {dateStr}
          </Badge>
        ) : (
          <span>{dateStr}</span>
        );

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">{content}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{row.nextAction}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      label: "Last Viewed",
      name: "lastViewedAt",
      sort: true,
      tooltip:
        "Last time this quote was viewed by someone outside your team. Views from logged-in team members are excluded.",
      format: (row: any) =>
        row.lastViewedAt
          ? format(new Date(row.lastViewedAt), "dd/MM/yyyy HH:mm")
          : "-",
    },
    // Only show Partner column for super admins on the main quotes page
    ...(isSuperAdmin && !organisationId
      ? [
          {
            label: "Partner",
            name: "partnerName",
            sort: true,
            linkTo: (row: any) => `/admin/partners/${row.partnerId}`,
            format: (row: any) => row.partnerName || "-",
          },
        ]
      : []),
    // Only show Owner column if not filtered by organisation
    ...(!organisationId
      ? [
          {
            label: "Owner",
            name: "ownerName",
            sort: true,
            format: (row: any) => row.ownerName || "-",
          },
        ]
      : []),
    {
      label: "Created At",
      name: "createdAt",
      sort: true,
      format: (row: any) => format(new Date(row.createdAt), "dd/MM/yyyy") || "",
    },
  ];

  const actions = (row: any) => {
    return (
      <Button asChild size={"sm"}>
        <Link href={`/admin/quotes/${row.id}`}>View</Link>
      </Button>
    );
  };

  const getDataParams = {
    ...(organisationId ? { organisationId } : {}),
    // Use fixed partnerId prop if set, otherwise use filter value (super admin only - server enforces this)
    ...(partnerId
      ? { partnerId }
      : filterValues.partnerId
        ? { partnerId: filterValues.partnerId as string }
        : {}),
    // Add status filter if not "all"
    ...(filterValues.statusFilter && filterValues.statusFilter !== "all"
      ? { statusFilter: filterValues.statusFilter as string }
      : {}),
    // Add owner filter if set
    ...(filterValues.ownerId
      ? { ownerId: filterValues.ownerId as string }
      : {}),
  };

  return (
    <>
      <TableFilters
        filters={filterConfig}
        values={filterValues}
        onChange={setFilterValue}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <DataTable
        tableId="admin-quotes"
        key={filterKey}
        getData={saGetQuoteTableData}
        getDataParams={
          Object.keys(getDataParams).length > 0 ? getDataParams : undefined
        }
        columns={columns}
        actions={actions}
      />
    </>
  );
};

export default QuotesTable;
