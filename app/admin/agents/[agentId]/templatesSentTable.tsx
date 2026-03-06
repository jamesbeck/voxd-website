"use client";

import { format, formatDistance } from "date-fns";
import saGetTemplateSendAttemptTableData from "@/actions/saGetTemplateSendAttemptTableData";
import DataTable from "@/components/adminui/Table";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

const TemplatesSentTable = ({ agentId }: { agentId: string }) => {
  const getDataParams = useMemo(() => ({ agentId }), [agentId]);

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
    />
  );
};

export default TemplatesSentTable;
