import { Button } from "@/components/ui/button";

export default function InvoicePdfTab({
  pdfUrl,
}: {
  pdfUrl: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild variant="outline" size="sm">
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            Open PDF in New Tab
          </a>
        </Button>
      </div>
      <div
        className="overflow-hidden rounded-lg border bg-background"
        style={{ height: "140vh", minHeight: 1200 }}
      >
        <object
          data={pdfUrl}
          type="application/pdf"
          className="block bg-white"
          style={{ width: "100%", height: "100%" }}
        >
          <iframe
            src={pdfUrl}
            title="Invoice PDF"
            className="block bg-white"
            style={{ width: "100%", height: "100%" }}
          />
        </object>
      </div>
    </div>
  );
}