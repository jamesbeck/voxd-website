"use client";

import saDeleteAgent from "@/actions/saDeleteAgent";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AgentActions({
  agentId,
  name,
  niceName,
  phoneNumber,
}: {
  agentId: string;
  name: string;
  niceName: string;
  phoneNumber: string;
}) {
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const router = useRouter();

  const whatsappUrl = phoneNumber
    ? `https://wa.me/${phoneNumber.replaceAll(" ", "")}`
    : "";

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
      downloadLink.download = `${(niceName || name).replace(
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

  const deleteAgent = async () => {
    setIsDeletingAgent(true);
    const saResponse = await saDeleteAgent({ agentId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Agent: ${
          saResponse.error || "There was an error deleting the agent"
        }`
      );
      setIsDeletingAgent(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    setIsDeletingAgent(false);
    router.push("/admin/agents");
  };

  return (
    <>
      <ButtonGroup>
        {!!phoneNumber && (
          <>
            <Button className="cursor-pointer" size="sm" asChild>
              <Link target="_blank" href={whatsappUrl}>
                Message {niceName || name}
              </Link>
            </Button>
            <Button
              className="cursor-pointer"
              size="sm"
              variant="outline"
              onClick={() => setQrDialogOpen(true)}
            >
              QR Code
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {isDeletingAgent ? <Spinner /> : <MoreHorizontalIcon />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <Alert
                destructive
                title={`Delete ${name}`}
                description="This action cannot be undone."
                actionText="Delete"
                onAction={deleteAgent}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Delete Agent
                </DropdownMenuItem>
              </Alert>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to message {niceName || name} on WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <QRCodeSVG
              ref={qrRef}
              value={whatsappUrl}
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
}
