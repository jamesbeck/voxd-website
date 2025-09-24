"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Waba } from "@/lib/meta/types";

const WabasTable = ({ wabas }: { wabas: Waba[] }) => {
  const tableData = wabas.map((waba) => {
    return {
      name: waba.name,
      accountReviewStatus: waba.account_review_status,
      canSendMessage: waba.health_status?.can_send_message,
      subscribedApps:
        waba.subscribed_apps?.data.map(
          (app) => app.whatsapp_business_api_data.name
        ) || [],
      phoneNumbers:
        waba.phone_numbers?.data.map(
          (phoneNumber) => phoneNumber.display_phone_number
        ) || [],
      id: waba.id,
    };
  });

  console.log(tableData);

  return (
    <DataTable
      data={tableData}
      defaultSort={[
        {
          id: "name",
          desc: false,
        },
      ]}
      columns={[
        {
          label: "Name",
          name: "name",
          sort: true,
          format: (value) => value || "",
        },
        {
          label: "Account Review Status",
          name: "accountReviewStatus",
          sort: true,
          format: (value) => (
            <Badge variant={value == "APPROVED" ? "default" : "destructive"}>
              {value}
            </Badge>
          ),
        },
        {
          label: "Send First Msg",
          name: "canSendMessage",
          sort: true,
          format: (value) => (
            <Badge variant={value == "AVAILABLE" ? "default" : "destructive"}>
              {value}
            </Badge>
          ),
        },
        {
          label: "Subscribed apps",
          name: "subscribedApps",
          sort: true,
          format: (value) => {
            // console.log(value);
            return (
              <div>
                {((value as string[]) || []).map((appName: string) => {
                  return (
                    <Badge
                      key={appName}
                      variant={
                        appName == "SwiftReply" ? "default" : "destructive"
                      }
                    >
                      {appName}
                    </Badge>
                  );
                })}
              </div>
            );
          },
        },
        {
          label: "Phone numbers",
          name: "phoneNumbers",
          sort: true,
          format: (value) => {
            // console.log(value);
            return (
              <div>
                {((value as string[]) || []).map((phoneNumber: string) => {
                  return (
                    <Badge key={phoneNumber} variant="default">
                      {phoneNumber}
                    </Badge>
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
          </>
        );
      }}
    />
  );
};

export default WabasTable;
