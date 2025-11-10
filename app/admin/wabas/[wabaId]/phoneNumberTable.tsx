"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import saRegisterPhoneNumber from "@/lib/meta/saRegisterPhoneNumber";
import saGetPhoneNumbersTableData from "@/actions/saGetPhoneNumbersTableData";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PhoneNumberTable = ({ wabaId }: { wabaId: string }) => {
  return (
    <DataTable
      getData={saGetPhoneNumbersTableData}
      getDataParams={{ wabaId }}
      defaultSort={{
        name: "verifiedName",
        direction: "asc",
      }}
      columns={[
        {
          label: "ID",
          name: "id",
          sort: true,
        },
        {
          label: "Number",
          name: "displayPhoneNumber",
          sort: true,
        },
        {
          label: "Verified Name",
          name: "verifiedName",
          sort: true,
        },
        {
          label: "Status",
          name: "status",
          sort: true,
          format: (row) => (
            <Badge
              className={cn(
                row.status == "CONNECTED" ? "bg-green-500" : "bg-red-500"
              )}
            >
              {row.status}
            </Badge>
          ),
        },
        {
          label: "Platform Type",
          name: "platformType",
          sort: true,
          format: (row) => (
            <Badge
              className={cn(
                row.platformType == "CLOUD_API" ? "bg-green-500" : "bg-red-500"
              )}
            >
              {row.platformType}
            </Badge>
          ),
        },
        {
          label: "Organisation Mode",
          name: "organisationMode",
          sort: true,
          format: (row) => (
            <Badge
              className={cn(
                row.organisationMode == "LIVE" ? "bg-green-500" : "bg-red-500"
              )}
            >
              {row.organisationMode}
            </Badge>
          ),
        },
        {
          label: "Send First Message",
          name: "healthStatus",
          sort: true,
          format: (row: any) => {
            return (
              <div className="flex gap-1">
                {row.healthStatus.entities.map((entity: any) => {
                  return (
                    <Tooltip
                      key={entity.id}
                      //only allow to open on hover if there are errors
                      open={
                        entity.can_send_message != "AVAILABLE" && entity.errors
                          ? undefined
                          : false
                      }
                    >
                      <TooltipTrigger>
                        <Badge
                          className={cn(
                            entity.can_send_message == "AVAILABLE"
                              ? "bg-green-500"
                              : "bg-red-500"
                          )}
                        >
                          {entity.entity_type}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-col gap-2">
                        {entity.errors &&
                          entity.can_send_message != "AVAILABLE" &&
                          entity.errors.map((error: any) => (
                            <div key={error.error_code}>
                              <p className="font-bold">
                                Error Code: {error.error_code}
                              </p>
                              <p>Description: {error.error_description}</p>
                              <p>Solution: {error.possible_solution}</p>
                            </div>
                          ))}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          },
        },
      ]}
      actions={(row: any) => {
        return (
          <>
            <Button className="cursor-pointer" asChild>
              <Link href={`/admin/wabas/${row.id}`}>View</Link>
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => saRegisterPhoneNumber({ phoneNumberId: row.id })}
            >
              Register
            </Button>
            <Button className="cursor-pointer" asChild>
              <Link
                target="_blank"
                href={`https://wa.me/${row.displayPhoneNumber.replaceAll(
                  " ",
                  ""
                )}`}
              >
                Message
              </Link>
            </Button>
          </>
        );
      }}
    />
  );
};

export default PhoneNumberTable;
