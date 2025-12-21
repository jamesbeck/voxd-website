"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetAgentTableData from "@/actions/saGetAgentTableData";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AgentsTable = () => {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedWhatsAppUrl, setSelectedWhatsAppUrl] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState("");

  const columns = [
    {
      label: "Name",
      name: "name",
      sort: true,
    },
    {
      label: "Nice Name",
      name: "niceName",
      sort: true,
    },
    {
      label: "Phone Number",
      name: "phoneNumber",
      sort: true,
    },
    {
      label: "Sessions",
      name: "sessionCount",
      sort: true,
    },
    {
      label: "Messages",
      name: "messageCount",
      sort: true,
    },
    {
      label: "Last Message",
      name: "lastMessageAt",
      sort: true,
      format: (row: any) => {
        const value = row.lastMessageAt;
        return value
          ? `${format(value, "dd/MM/yyyy HH:mm")} (${formatDistance(
              value,
              new Date()
            )})`
          : "Never";
      },
    },
  ];

  const actions = (row: any) => {
    const whatsappUrl = row.phoneNumber
      ? `https://wa.me/${row.phoneNumber.replaceAll(" ", "")}`
      : "";

    return (
      <div className="flex gap-1">
        <Button asChild size={"sm"}>
          <Link href={`/admin/agents/${row.id}`}>View</Link>
        </Button>
        {!!row.phoneNumber && (
          <>
            <Button className="cursor-pointer" size={"sm"} asChild>
              <Link target="_blank" href={whatsappUrl}>
                Message
              </Link>
            </Button>
            <Button
              className="cursor-pointer"
              size={"sm"}
              variant="outline"
              onClick={() => {
                setSelectedWhatsAppUrl(whatsappUrl);
                setSelectedAgentName(row.niceName || row.name);
                setQrDialogOpen(true);
              }}
            >
              QR Code
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <DataTable
        columns={columns}
        defaultSort={{
          name: "niceName",
          direction: "asc",
        }}
        actions={actions}
        getData={saGetAgentTableData}
      />

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to message {selectedAgentName} on WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <QRCodeSVG
              value={selectedWhatsAppUrl}
              size={256}
              level="H"
              includeMargin
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentsTable;
