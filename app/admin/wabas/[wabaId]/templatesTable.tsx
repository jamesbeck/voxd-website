"use client";

import DataTable from "@/components/adminui/Table";
import { Badge } from "@/components/ui/badge";
import saGetWabaTemplatesTableData from "@/actions/saGetWabaTemplatesTableData";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TemplatesTable = ({ wabaId }: { wabaId: string }) => {
  return (
    <DataTable
      getData={saGetWabaTemplatesTableData}
      getDataParams={{ wabaId }}
      defaultSort={{
        name: "name",
        direction: "asc",
      }}
      columns={[
        {
          label: "Name",
          name: "name",
          sort: true,
        },
        {
          label: "Category",
          name: "category",
          sort: true,
          format: (row) => (
            <Badge
              variant="outline"
              className={cn(
                row.category === "MARKETING" &&
                  "border-purple-500 text-purple-600",
                row.category === "UTILITY" && "border-blue-500 text-blue-600",
                row.category === "AUTHENTICATION" &&
                  "border-orange-500 text-orange-600"
              )}
            >
              {row.category}
            </Badge>
          ),
        },
        {
          label: "Language",
          name: "language",
          sort: true,
        },
        {
          label: "Status",
          name: "status",
          sort: true,
          format: (row) => (
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  className={cn(
                    row.status === "APPROVED" && "bg-green-500",
                    row.status === "PENDING" && "bg-yellow-500",
                    row.status === "REJECTED" && "bg-red-500",
                    row.status === "PAUSED" && "bg-gray-500",
                    row.status === "DISABLED" && "bg-gray-500"
                  )}
                >
                  {row.status}
                </Badge>
              </TooltipTrigger>
              {row.rejectedReason && (
                <TooltipContent>
                  <p>Reason: {row.rejectedReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ),
        },
        {
          label: "Quality",
          name: "qualityScore",
          sort: true,
          format: (row) =>
            row.qualityScore ? (
              <Badge
                variant="outline"
                className={cn(
                  row.qualityScore === "GREEN" &&
                    "border-green-500 text-green-600",
                  row.qualityScore === "YELLOW" &&
                    "border-yellow-500 text-yellow-600",
                  row.qualityScore === "RED" && "border-red-500 text-red-600"
                )}
              >
                {row.qualityScore}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            ),
        },
        {
          label: "ID",
          name: "id",
          sort: true,
        },
      ]}
    />
  );
};

export default TemplatesTable;
