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
              <Badge variant="outline">{domainStatus.status}</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Copy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainStatus.records.map((record, index) => (
                  <TableRow key={`${record.name}-${index}`}>
                    <TableCell>{record.type}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs break-all">
                      {record.value}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(record.value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          Save
        </Button>
      </form>
    </Form>
  );
}
