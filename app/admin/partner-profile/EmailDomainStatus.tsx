"use client";

import { useEffect, useState } from "react";
import saGetResendDomainStatus, {
  type ResendDomainStatus,
} from "@/actions/saGetResendDomainStatus";
import saRecheckResendDomain from "@/actions/saRecheckResendDomain";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

export default function EmailDomainStatus() {
  const [data, setData] = useState<ResendDomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);

  const fetchStatus = async () => {
    try {
      const result = await saGetResendDomainStatus();
      setData(result);
    } catch {
      toast.error("Failed to load domain status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRecheck = async () => {
    if (!data || data.status === "not_configured") return;
    setRechecking(true);
    try {
      const result = await saRecheckResendDomain(data.domainId);
      setData(result);
      if (result.status === "not_configured") return;
      if (result.status === "verified") {
        toast.success("Domain verified successfully!");
      } else {
        toast.info(
          "Verification triggered. DNS changes can take up to 72 hours to propagate.",
        );
      }
    } catch {
      toast.error("Failed to re-check domain");
    } finally {
      setRechecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Checking domain status...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.status === "not_configured") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Sending Domain</CardTitle>
          <CardDescription>
            Configure your custom email sending domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No email domain configured</AlertTitle>
            <AlertDescription>
              Your account does not have a custom email sending domain
              configured. All emails will be sent from <strong>voxd.ai</strong>.
              Contact your administrator to set up a custom domain.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isVerified = data.status === "verified";
  const allRecordsVerified = data.records.every((r) => r.status === "verified");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Sending Domain</CardTitle>
            <CardDescription className="mt-1">
              Domain: <strong>{data.domain}</strong>
            </CardDescription>
          </div>
          {isVerified && allRecordsVerified ? (
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-amber-700 bg-amber-50 border-amber-200"
            >
              <AlertTriangle className="h-3 w-3" />
              Pending Verification
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerified && allRecordsVerified ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Domain Verified</AlertTitle>
            <AlertDescription className="text-green-700">
              Your domain <strong>{data.domain}</strong> is verified and ready
              to send email.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">
                DNS Configuration Required
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Add the following DNS records to your domain to verify ownership
                and enable email sending. DNS changes can take up to 72 hours to
                propagate.
              </AlertDescription>
            </Alert>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Host / Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-[80px]">Priority</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.records.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="secondary">{record.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                            {record.name}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(record.name)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all max-w-[400px]">
                            {record.value}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{record.priority ?? "—"}</TableCell>
                      <TableCell>
                        {record.status === "verified" ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleRecheck} disabled={rechecking}>
                {rechecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {rechecking ? "Checking..." : "Re-check Domain"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
