"use client";

import { format, formatDistance } from "date-fns";
import saGetCustomFunctionTableData from "@/actions/saGetCustomFunctionTableData";
import DataTable from "@/components/adminui/Table";
import { Badge } from "@/components/ui/badge";

const CustomFunctionsTable = () => {
  return (
    <DataTable
      tableId="custom-functions"
      getData={saGetCustomFunctionTableData}
      defaultSort={{ name: "label", direction: "asc" }}
      columns={[
        {
          label: "Function",
          name: "label",
          sort: true,
          format: (row: any) => (
            <div className="space-y-1">
              <p className="font-medium">
                {row.displayName || row.niceName || row.name || row.key}
              </p>
              <p className="text-xs text-muted-foreground">{row.key}</p>
            </div>
          ),
        },
        {
          label: "Agent",
          name: "agentName",
          sort: true,
        },
        {
          label: "Scopes",
          name: "targetScopes",
          sort: true,
          format: (row: any) => row.targetScopes.join(", "),
        },
        {
          label: "Manual",
          name: "allowManualRun",
          sort: true,
          format: (row: any) => (
            <Badge
              className={row.allowManualRun ? "bg-green-600" : "bg-slate-500"}
            >
              {row.allowManualRun ? "Yes" : "No"}
            </Badge>
          ),
        },
        {
          label: "API",
          name: "allowApiRun",
          sort: true,
          format: (row: any) => (
            <Badge
              className={row.allowApiRun ? "bg-green-600" : "bg-slate-500"}
            >
              {row.allowApiRun ? "Yes" : "No"}
            </Badge>
          ),
        },
        {
          label: "Enabled",
          name: "enabled",
          sort: true,
          format: (row: any) => (
            <Badge className={row.enabled ? "bg-green-600" : "bg-red-600"}>
              {row.enabled ? "Enabled" : "Disabled"}
            </Badge>
          ),
        },
        {
          label: "Scheduling",
          name: "supportsScheduling",
          sort: true,
          format: (row: any) => (
            <Badge
              className={
                row.supportsScheduling ? "bg-blue-600" : "bg-slate-500"
              }
            >
              {row.supportsScheduling ? "Supported" : "No"}
            </Badge>
          ),
        },
        {
          label: "Next Scheduled Run",
          name: "nextScheduledRunAt",
          sort: true,
          format: (row: any) =>
            row.nextScheduledRunAt
              ? `${format(row.nextScheduledRunAt, "dd/MM/yyyy HH:mm:ss")} (${formatDistance(
                  row.nextScheduledRunAt,
                  new Date(),
                  { addSuffix: true },
                )})`
              : "-",
        },
        {
          label: "Updated",
          name: "updatedAt",
          sort: true,
          format: (row: any) =>
            `${format(row.updatedAt, "dd/MM/yyyy HH:mm:ss")} (${formatDistance(
              row.updatedAt,
              new Date(),
              { addSuffix: true },
            )})`,
        },
      ]}
    />
  );
};

export default CustomFunctionsTable;
