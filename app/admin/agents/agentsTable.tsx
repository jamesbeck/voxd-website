"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import saGetAgentTableData from "@/actions/saGetAgentTableData";
import { useRef, useState } from "react";
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
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadQRCode = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${selectedAgentName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_whatsapp_qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

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
              ref={qrRef}
              value={selectedWhatsAppUrl}
              size={256}
              level="H"
              includeMargin
            />
          </div>
          <div className="flex justify-center pb-4">
            <Button onClick={downloadQRCode}>Save as Image</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentsTable;
