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
import { useEffect, useState } from "react";
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

  const fetchDomainStatus = async () => {
    setDomainLoading(true);
    try {
      const result = await saGetPartnerResendDomainStatus(partnerId);
      setDomainStatus(result);
    } catch {
      toast.error("Failed to load domain status");
    } finally {
      setDomainLoading(false);
    }
  };

  const fetchVercelStatus = async () => {
    setVercelLoading(true);
    try {
      const result = await saGetPartnerVercelDomainStatus(partnerId);
      setVercelStatus(result);
    } catch {
      toast.error("Failed to load Vercel domain status");
    } finally {
      setVercelLoading(false);
    }
  };

  const fetchCoreStatus = async () => {
    setCoreLoading(true);
    try {
      const result = await saGetPartnerCoreDomainStatus(partnerId);
      setCoreStatus(result);
    } catch {
      toast.error("Failed to load core domain status");
    } finally {
      setCoreLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainStatus();
    fetchVercelStatus();
    fetchCoreStatus();
  }, [partnerId]);

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
                  <Input placeholder="mail.partner.com" {...field} />
                </FormControl>
                {domainLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : domainStatus && domainStatus.status !== "not_configured" ? (
                  domainStatus.status === "verified" ? (
                    <Badge
                      variant="default"
                      className="shrink-0 bg-green-600 hover:bg-green-600"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-amber-700 bg-amber-50 border-amber-200"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Pending
                    </Badge>
                  )
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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

      {/* DNS Records for email domain */}
      {!domainLoading &&
        domainStatus &&
        domainStatus.status !== "not_configured" &&
        domainStatus.status !== "verified" && (
          <div className="mt-6 space-y-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">
                DNS Configuration Required
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Add the following DNS records to verify ownership and enable
                email sending. DNS changes can take up to 72 hours to propagate.
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
                  {domainStatus.records.map((record, index) => (
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
                            type="button"
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
                            type="button"
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
              <Button
                type="button"
                onClick={handleRecheck}
                disabled={rechecking}
              >
                {rechecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {rechecking ? "Checking..." : "Re-check Domain"}
              </Button>
            </div>
          </div>
        )}
    </Form>
  );
}
