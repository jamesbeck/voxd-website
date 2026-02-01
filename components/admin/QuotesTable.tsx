"use client";

import { useState } from "react";
import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import saGetQuoteTableData from "@/actions/saGetQuoteTableData";
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
  isSuperAdmin?: boolean;
  userPartnerId?: string | null;
  showPartnerToggle?: boolean;
}

const QuotesTable = ({
  organisationId,
  isSuperAdmin,
  userPartnerId,
  showPartnerToggle = true,
}: QuotesTableProps) => {
  const [showOnlyMyPartner, setShowOnlyMyPartner] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("open");

  const statusTabs = [
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

  const columns = [
    // Only show Organisation column if not filtered by organisation
    ...(!organisationId
      ? [
          {
            label: "Organisation",
            name: "organisationName",
            sort: true,
            linkTo: (row: any) => `/admin/organisations/${row.organisationId}`,
            format: (row: any) => {
              const name = row.organisationName || "";
              if (name.length <= 40) return name;
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        {name.slice(0, 40)}...
                      </span>
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
      label: "Created At",
      name: "createdAt",
      sort: true,
      format: (row: any) => format(new Date(row.createdAt), "dd/MM/yyyy") || "",
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
    ...(isSuperAdmin && showOnlyMyPartner && userPartnerId
      ? { partnerId: userPartnerId }
      : {}),
    ...(statusFilter !== "all" ? { statusFilter } : {}),
  };

  return (
    <>
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="mb-4"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isSuperAdmin && !organisationId && showPartnerToggle && (
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="partner-filter"
            checked={showOnlyMyPartner}
            onCheckedChange={setShowOnlyMyPartner}
          />
          <Label htmlFor="partner-filter">Show only my partner</Label>
        </div>
      )}
      <DataTable
        tableId="admin-quotes"
        key={`${showOnlyMyPartner}-${statusFilter}`}
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
