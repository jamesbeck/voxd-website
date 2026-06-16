"use client";
import {
  AlertCircleIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Copy,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import saUpdatePartner from "@/actions/saUpdatePartner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import saGetPartnerResendDomainStatus from "@/actions/saGetPartnerResendDomainStatus";
import saRecheckPartnerResendDomain from "@/actions/saRecheckPartnerResendDomain";
import type { ResendDomainStatus } from "@/actions/saGetResendDomainStatus";
import {
  saGetPartnerVercelDomainStatus,
  saAddPartnerVercelDomain,
  type VercelDomainStatus,
} from "@/actions/saVercelDomain";
import {
  saGetPartnerCoreDomainStatus,
  type CoreDomainStatus,
} from "@/actions/saCoreDomain";

const formSchema = z.object({
  domain: z.string().nonempty("Domain is required"),
  coreDomain: z.string().optional(),
  sendEmailFromDomain: z.string().optional(),
});

type DnsInstructionRecord = {
  type: string;
  name: string;
  value: string;
  status?: string;
  rank?: number;
};

function formatStatusLabel(status: string) {
  if (status.includes(":")) {
    return status;
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPositiveStatus(status: string) {
  return status === "verified";
}

function getStatusBadgeClass(isPositive: boolean) {
  return isPositive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function formatDnsSummaryName(name: string, zoneDomain?: string) {
  const normalizedName = name.replace(/\.$/, "");
  const normalizedZone = zoneDomain?.replace(/\.$/, "");

  if (!normalizedZone) {
    return normalizedName;
  }

  if (normalizedName === "@") {
    return `@ (${normalizedZone})`;
  }

  if (normalizedName === normalizedZone) {
    return normalizedName;
  }

  if (normalizedName.endsWith(`.${normalizedZone}`)) {
    const shortName = normalizedName.slice(0, -(normalizedZone.length + 1));
    return `${shortName} (${normalizedName})`;
  }

  return `${normalizedName} (${normalizedName}.${normalizedZone})`;
}

function buildDnsSummaryEntry(
  record: DnsInstructionRecord,
  options?: { priority?: number; zoneDomain?: string },
) {
  const lines = [
    `Type: \`${record.type}\``,
    `Name: ${formatDnsSummaryName(record.name, options?.zoneDomain)}`,
    `Value: \`${record.value}\``,
  ];

  if (options?.priority !== undefined) {
    lines.push(`Priority: \`${options.priority}\``);
  }

  return lines.join("\n");
}

function DnsInstructionsTable({
  records,
  onCopy,
  showStatus = false,
  showRank = false,
  zoneDomain,
}: {
  records: DnsInstructionRecord[];
  onCopy: (text: string) => void;
  showStatus?: boolean;
  showRank?: boolean;
  zoneDomain?: string;
}) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[90px]">Type</TableHead>
          <TableHead className="w-[220px]">Name</TableHead>
          <TableHead>Value</TableHead>
          {showRank ? <TableHead className="w-[80px]">Rank</TableHead> : null}
          {showStatus ? (
            <TableHead className="w-[120px]">Status</TableHead>
          ) : null}
          <TableHead className="w-[80px]">Copy</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record, index) => (
          <TableRow
            key={`${record.type}-${record.name}-${record.value}-${index}`}
          >
            <TableCell>{record.type}</TableCell>
            <TableCell className="font-mono text-xs">
              {formatDnsSummaryName(record.name, zoneDomain)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              <div
                className="max-w-full truncate whitespace-nowrap"
                title={record.value}
              >
                {record.value}
              </div>
            </TableCell>
            {showRank ? <TableCell>{record.rank ?? "-"}</TableCell> : null}
            {showStatus ? (
              <TableCell>
                {record.status ? (
                  <Badge
                    variant="outline"
                    className={getStatusBadgeClass(
                      isPositiveStatus(record.status),
                    )}
                  >
                    {formatStatusLabel(record.status)}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
            ) : null}
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onCopy(record.value)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function EditPartnerDomainsForm({
  partnerId,
  domain,
  coreDomain,
  sendEmailFromDomain,
}: {
  partnerId: string;
  domain?: string;
  coreDomain?: string;
  sendEmailFromDomain?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [domainStatus, setDomainStatus] = useState<ResendDomainStatus | null>(
    null,
  );
  const [domainLoading, setDomainLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [vercelStatus, setVercelStatus] = useState<VercelDomainStatus | null>(
    null,
  );
  const [vercelLoading, setVercelLoading] = useState(true);
  const [addingToVercel, setAddingToVercel] = useState(false);
  const [coreStatus, setCoreStatus] = useState<CoreDomainStatus | null>(null);
  const [coreLoading, setCoreLoading] = useState(true);
  const router = useRouter();

  const fetchDomainStatus = useCallback(async () => {
    setDomainLoading(true);
    try {
      const result = await saGetPartnerResendDomainStatus(partnerId);
      setDomainStatus(result);
    } catch {
      toast.error("Failed to load domain status");
    } finally {
      setDomainLoading(false);
    }
  }, [partnerId]);

  const fetchVercelStatus = useCallback(async () => {
    setVercelLoading(true);
    try {
      const result = await saGetPartnerVercelDomainStatus(partnerId);
      setVercelStatus(result);
    } catch {
      toast.error("Failed to load Vercel domain status");
    } finally {
      setVercelLoading(false);
    }
  }, [partnerId]);

  const fetchCoreStatus = useCallback(async () => {
    setCoreLoading(true);
    try {
      const result = await saGetPartnerCoreDomainStatus(partnerId);
      setCoreStatus(result);
    } catch {
      toast.error("Failed to load core domain status");
    } finally {
      setCoreLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchDomainStatus();
    fetchVercelStatus();
    fetchCoreStatus();
  }, [fetchCoreStatus, fetchDomainStatus, fetchVercelStatus]);

  const handleRecheck = async () => {
    if (!domainStatus || domainStatus.status === "not_configured") return;
    setRechecking(true);
    try {
      const result = await saRecheckPartnerResendDomain(
        partnerId,
        domainStatus.domainId,
      );
      setDomainStatus(result);
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

  const handleAddToVercel = async () => {
    setAddingToVercel(true);
    try {
      const result = await saAddPartnerVercelDomain(partnerId);
      setVercelStatus(result);
      if (result.status === "verified") {
        toast.success("Domain added and verified!");
      } else {
        toast.success(
          "Domain added to Vercel. Configure DNS to complete setup.",
        );
      }
    } catch {
      toast.error("Failed to add domain to Vercel");
    } finally {
      setAddingToVercel(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: domain || "",
      coreDomain: coreDomain || "",
      sendEmailFromDomain: sendEmailFromDomain || "",
    },
  });

  const coreDnsRecords: DnsInstructionRecord[] =
    coreStatus && coreStatus.status !== "not_configured"
      ? [
          {
            type: "CNAME",
            name: coreStatus.domain,
            value: coreStatus.expectedTarget,
            status:
              coreStatus.status === "verified"
                ? "verified"
                : coreStatus.status === "wrong_cname"
                  ? `Current: ${coreStatus.cname}`
                  : "missing",
          },
        ]
      : [];

  const vercelDnsRecords: DnsInstructionRecord[] =
    vercelStatus && vercelStatus.status !== "not_configured"
      ? vercelStatus.dnsRecords.map((record) => ({
          ...record,
          status: vercelStatus.status === "verified" ? "verified" : "required",
        }))
      : [];

  const incompleteResendRecords =
    domainStatus && domainStatus.status !== "not_configured"
      ? domainStatus.records.filter((record) => record.status !== "verified")
      : [];

  const incompleteVercelRecords =
    vercelStatus && vercelStatus.status !== "not_configured"
      ? vercelDnsRecords.filter((record) => record.status !== "verified")
      : [];

  const incompleteCoreRecords =
    coreStatus &&
    coreStatus.status !== "not_configured" &&
    coreStatus.status !== "verified"
      ? coreDnsRecords
      : [];

  const resendZoneDomain =
    domainStatus && domainStatus.status !== "not_configured"
      ? domainStatus.domain
      : undefined;

  const vercelZoneDomain =
    vercelStatus && vercelStatus.status !== "not_configured"
      ? vercelStatus.domain
      : undefined;

  const coreZoneDomain =
    coreStatus && coreStatus.status !== "not_configured"
      ? coreStatus.domain
      : undefined;

  const dnsChangesMarkdown = [
    ...incompleteResendRecords.map((record) =>
      buildDnsSummaryEntry(record, {
        priority: record.type === "MX" ? 10 : undefined,
        zoneDomain: resendZoneDomain,
      }),
    ),
    ...incompleteVercelRecords.map((record) =>
      buildDnsSummaryEntry(record, {
        zoneDomain: vercelZoneDomain,
      }),
    ),
    ...incompleteCoreRecords.map((record) =>
      buildDnsSummaryEntry(record, {
        zoneDomain: coreZoneDomain,
      }),
    ),
  ].join("\n\n");

  const resendStatusPositive = domainStatus?.status === "verified";
  const vercelStatusPositive = vercelStatus?.status === "verified";
  const coreStatusPositive = coreStatus?.status === "verified";

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId,
      domain: values.domain,
      coreDomain: values.coreDomain,
      sendEmailFromDomain: values.sendEmailFromDomain,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the partner");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
      if (response.fieldErrors) {
        for (const key in response.fieldErrors) {
          form.setError(key as keyof typeof values, {
            type: "manual",
            message: response.fieldErrors[key],
          });
        }
      }
    }

    if (response.success) {
      toast.success("Partner domains updated");
      router.refresh();
      fetchDomainStatus();
      fetchVercelStatus();
      fetchCoreStatus();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="domain"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="partner.com" {...field} />
                </FormControl>
                {vercelLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : vercelStatus && vercelStatus.status === "verified" ? (
                  <Badge
                    variant="default"
                    className="shrink-0 bg-green-600 hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Vercel
                  </Badge>
                ) : vercelStatus && vercelStatus.status === "not_found" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={addingToVercel}
                    onClick={handleAddToVercel}
                  >
                    {addingToVercel ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    Add to Vercel
                  </Button>
                ) : vercelStatus && vercelStatus.status !== "not_configured" ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-amber-700 bg-amber-50 border-amber-200"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {vercelStatus.status === "misconfigured"
                      ? "Misconfigured"
                      : "Not Verified"}
                  </Badge>
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coreDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Core Domain</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="corepartner.com" {...field} />
                </FormControl>
                {coreLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : coreStatus && coreStatus.status === "verified" ? (
                  <Badge
                    variant="default"
                    className="shrink-0 bg-green-600 hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    CNAME OK
                  </Badge>
                ) : coreStatus && coreStatus.status === "wrong_cname" ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-red-700 bg-red-50 border-red-200"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Wrong CNAME: {coreStatus.cname}
                  </Badge>
                ) : coreStatus && coreStatus.status === "no_cname" ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-red-700 bg-red-50 border-red-200"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    No CNAME
                  </Badge>
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sendEmailFromDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Send Email From Domain</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="emails.partner.com" {...field} />
                </FormControl>
                {domainLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : domainStatus && domainStatus.status === "verified" ? (
                  <Badge
                    variant="default"
                    className="shrink-0 bg-green-600 hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : domainStatus && domainStatus.status !== "not_configured" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rechecking}
                    onClick={handleRecheck}
                  >
                    {rechecking ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Recheck
                  </Button>
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {domainStatus && domainStatus.status !== "not_configured" && (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resend DNS Records</p>
                <p className="text-sm text-muted-foreground">
                  Configure these DNS records to verify {domainStatus.domain}
                </p>
              </div>
              <Badge
                variant="outline"
                className={getStatusBadgeClass(resendStatusPositive)}
              >
                {formatStatusLabel(domainStatus.status)}
              </Badge>
            </div>

            <DnsInstructionsTable
              records={domainStatus.records}
              onCopy={copyToClipboard}
              showStatus
              zoneDomain={resendZoneDomain}
            />
          </div>
        )}

        {vercelStatus && vercelStatus.status !== "not_configured" && (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Vercel DNS Records</p>
                <p className="text-sm text-muted-foreground">
                  Add this DNS record for {vercelStatus.domain} to point the
                  domain at Vercel.
                </p>
                {vercelStatus.configuredBy ? (
                  <p className="text-xs text-muted-foreground">
                    Current detection: {vercelStatus.configuredBy}
                  </p>
                ) : null}
              </div>
              <Badge
                variant="outline"
                className={getStatusBadgeClass(vercelStatusPositive)}
              >
                {formatStatusLabel(vercelStatus.status)}
              </Badge>
            </div>

            {vercelStatus.dnsRecords.length > 0 ? (
              <DnsInstructionsTable
                records={vercelDnsRecords}
                onCopy={copyToClipboard}
                showStatus
                zoneDomain={vercelZoneDomain}
              />
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No DNS recommendation available yet</AlertTitle>
                <AlertDescription>
                  Add the domain to Vercel first, then reload this tab to fetch
                  the recommended DNS values.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {coreStatus && coreStatus.status !== "not_configured" && (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Core Domain CNAME</p>
                <p className="text-sm text-muted-foreground">
                  Point the core domain to Voxd with a simple CNAME record.
                </p>
              </div>
              <Badge
                variant="outline"
                className={getStatusBadgeClass(coreStatusPositive)}
              >
                {formatStatusLabel(coreStatus.status)}
              </Badge>
            </div>

            <DnsInstructionsTable
              records={coreDnsRecords}
              onCopy={copyToClipboard}
              showStatus
              zoneDomain={coreZoneDomain}
            />
          </div>
        )}

        {form.formState.errors.root && (
          <div className="max-w-xl">
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">DNS Changes Summary</p>
              <p className="text-sm text-muted-foreground">
                Markdown summary of the remaining DNS work, ready to copy and
                send.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  dnsChangesMarkdown || "All DNS changes are complete.",
                )
              }
            >
              <Copy className="h-4 w-4" />
              Copy Markdown
            </Button>
          </div>
          <Textarea
            readOnly
            value={dnsChangesMarkdown || "All DNS changes are complete."}
            className="min-h-[260px] font-mono text-xs"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          Save
        </Button>
      </form>
    </Form>
  );
}
