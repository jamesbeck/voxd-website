"use client";

import { format, formatDistance } from "date-fns";
import saGetTemplateSendAttemptTableData from "@/actions/saGetTemplateSendAttemptTableData";
import DataTable from "@/components/adminui/Table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

const TemplatesSentTable = ({ agentId }: { agentId: string }) => {
  const [exporting, setExporting] = useState(false);
  const getDataParams = useMemo(() => ({ agentId }), [agentId]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const result = await saGetTemplateSendAttemptTableData({
        agentId,
        page: 1,
        pageSize: 10000,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      if (!result.success) return;

      const headers = [
        "User Name",
        "Number",
        "Email",
        "Template",
        "Success",
        "Error",
        "Sent At",
      ];
      const escapeCsv = (val: any) => {
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const csvRows = result.data.map((row: any) =>
        [
          row.chatUserName ?? "",
          row.chatUserNumber ?? "",
          row.chatUserEmail ?? "",
          row.templateName ?? "",
          row.success ? "Yes" : "No",
          row.error ?? "",
          row.createdAt ? format(row.createdAt, "yyyy-MM-dd HH:mm:ss") : "",
        ]
          .map(escapeCsv)
          .join(","),
      );

      const csv = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `templates-sent-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      label: "User Name",
      name: "chatUserName",
      sort: true,
    },
    {
      label: "Number",
      name: "chatUserNumber",
      sort: true,
    },
    {
      label: "Email",
      name: "chatUserEmail",
      sort: true,
    },
    {
      label: "Template",
      name: "templateName",
      sort: true,
    },
    {
      label: "Success",
      name: "success",
      sort: true,
      format: (row: any) =>
        row.success ? (
          <Badge className="bg-green-500">Yes</Badge>
        ) : (
          <Badge variant="destructive">No</Badge>
        ),
    },
    {
      label: "Error",
      name: "error",
      format: (row: any) => row.error || "",
    },
    {
      label: "Sent At",
      name: "createdAt",
      sort: true,
      format: (row: any) =>
        row.createdAt
          ? `${format(row.createdAt, "dd/MM/yyyy HH:mm")} (${formatDistance(row.createdAt, new Date(), { addSuffix: true })})`
          : "",
    },
  ];

  return (
    <DataTable
      columns={columns}
      getData={saGetTemplateSendAttemptTableData}
      getDataParams={getDataParams}
      defaultSort={{ name: "createdAt", direction: "desc" }}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={exporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      }
    />
  );
};

export default TemplatesSentTable;
