"use client";

import { useState } from "react";
import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import saGetQuoteTableData from "@/actions/saGetQuoteTableData";
import { format } from "date-fns";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Draft":
      return <Badge variant="secondary">{status}</Badge>;
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
    case "Sent to Client":
      return (
        <Badge className="bg-purple-500 text-white border-transparent">
          Sent to Client
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
}

const QuotesTable = ({ organisationId, isSuperAdmin, userPartnerId }: QuotesTableProps) => {
  const [showOnlyMyPartner, setShowOnlyMyPartner] = useState(true);
  const columns = [
    // Only show Organisation column if not filtered by organisation
    ...(!organisationId
      ? [
          {
            label: "Organisation",
            name: "organisationName",
            sort: true,
            linkTo: (row: any) => `/admin/organisations/${row.organisationId}`,
          },
        ]
      : []),
    {
      label: "Title",
      name: "title",
      sort: true,
      linkTo: (row: any) => `/admin/quotes/${row.id}`,
      format: (row: any) => row.title || "",
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
    ...(isSuperAdmin && showOnlyMyPartner && userPartnerId ? { partnerId: userPartnerId } : {}),
  };

  return (
    <>
      {isSuperAdmin && !organisationId && (
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
        key={showOnlyMyPartner ? "filtered" : "all"}
        getData={saGetQuoteTableData}
        getDataParams={Object.keys(getDataParams).length > 0 ? getDataParams : undefined}
        columns={columns}
        actions={actions}
      />
    </>
  );
};

export default QuotesTable;
