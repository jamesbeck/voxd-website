"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneNumber } from "@/lib/meta/types";
import saRegisterPhoneNumber from "@/lib/meta/saRegisterPhoneNumber";

const PhoneNumberTable = ({
  phoneNumbers,
}: {
  phoneNumbers: PhoneNumber[];
}) => {
  const tableData = phoneNumbers.map((phoneNumber) => {
    return {
      number: phoneNumber.display_phone_number,
      displayName: phoneNumber.verified_name,
      status: phoneNumber.status,
      platformType: phoneNumber.platform_type,
      id: phoneNumber.id,
    };
  });

  return (
    <DataTable
      data={tableData}
      defaultSort={[
        {
          id: "number",
          desc: false,
        },
      ]}
      columns={[
        {
          label: "ID",
          name: "id",
          sort: true,
          format: (value) => value || "",
        },
        {
          label: "Number",
          name: "number",
          sort: true,
          format: (value) => value || "",
        },
        {
          label: "Display Name",
          name: "displayName",
          sort: true,
          format: (value) => value || "",
        },
        {
          label: "Status",
          name: "status",
          sort: true,
          format: (value) => (
            <Badge variant={value == "CONNECTED" ? "default" : "destructive"}>
              {value}
            </Badge>
          ),
        },
        {
          label: "Platform Type",
          name: "platformType",
          sort: true,
          format: (value) => (
            <Badge variant={value == "CLOUD_API" ? "default" : "destructive"}>
              {value}
            </Badge>
          ),
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
              <Link href={`https://wa.me/${row.number.replaceAll(" ", "")}`}>
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
