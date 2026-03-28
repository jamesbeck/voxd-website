"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import saDeleteExample from "@/actions/saDeleteExample";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Trash2Icon,
  ExternalLinkIcon,
  CopyIcon,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import RecordActions from "@/components/admin/RecordActions";

export default function ExampleActions({
  exampleId,
  title,
  slug,
}: {
  exampleId: string;
  title: string;
  slug: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [origin, setOrigin] = useState("");
  const router = useRouter();
  const exampleUrl = `/examples/${slug}`;

  // Set origin on mount
  if (typeof window !== "undefined" && !origin) {
    setOrigin(window.location.origin);
  }

  const copyToClipboard = async () => {
    const fullUrl = `${window.location.origin}${exampleUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const deleteExample = async () => {
    setIsDeleting(true);
    const response = await saDeleteExample({ exampleId });

    if (!response.success) {
      toast.error(
        `Error Deleting Example: ${
          response.error || "There was an error deleting the example"
        }`
      );
      setIsDeleting(false);
      return;
    }

    toast.success(`Successfully deleted "${title}"`);
    setIsDeleting(false);
    router.push("/admin/examples");
  };

  return (
    <>
      <RecordActions
        buttons={[
          {
            buttons: [
              {
                label: "View Example",
                icon: <ExternalLinkIcon />,
                variant: "outline",
                href: exampleUrl,
                target: "_blank",
              },
              {
                icon: <CopyIcon />,
                variant: "outline",
                tooltip: "Copy link to clipboard",
                onClick: copyToClipboard,
              },
            ],
          },
        ]}
        dropdown={{
          loading: isDeleting,
          groups: [
            {
              items: [
                {
                  label: "Get Embed Code",
                  icon: <Code2 />,
                  onSelect: () => setEmbedDialogOpen(true),
                },
                {
                  label: "Delete Example",
                  icon: <Trash2Icon />,
                  danger: true,
                  loading: isDeleting,
                  confirm: {
                    title: `Delete "${title}"`,
                    description:
                      "This action cannot be undone. The example and all associated data will be permanently deleted.",
                    actionText: "Delete",
                    destructive: true,
                    onAction: deleteExample,
                  },
                },
              ],
            },
          ],
        }}
      />

      {/* Embed Dialog */}
      <Dialog
        open={embedDialogOpen}
        onOpenChange={(open) => {
          setEmbedDialogOpen(open);
          if (!open) {
            setCopiedUrl(false);
            setCopiedCode(false);
          }
        }}
      >
        <DialogContent className="w-full max-w-6xl sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Embed Example</DialogTitle>
            <DialogDescription>
              Copy the URL or iframe code to embed this example on your
              website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Embed URL</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const url = `${origin}/iframes/examples/${exampleId}`;
                    await navigator.clipboard.writeText(url);
                    setCopiedUrl(true);
                    toast.success("URL copied to clipboard");
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {origin}/iframes/examples/{exampleId}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Iframe Code</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const iframeCode = `<iframe\n  src="${origin}/iframes/examples/${exampleId}"\n  width="100%"\n  height="800"\n  frameborder="0"\n  allowtransparency="true"\n  style="min-height: 800px;"\n></iframe>`;
                    await navigator.clipboard.writeText(iframeCode);
                    setCopiedCode(true);
                    toast.success("Code copied to clipboard");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                {`<iframe
  src="${origin}/iframes/examples/${exampleId}"
  width="100%"
  height="800"
  frameborder="0"
  allowtransparency="true"
  style="min-height: 800px;"
></iframe>`}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEmbedDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
