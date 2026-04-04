"use client";
import { AlertCircleIcon } from "lucide-react";
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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import saUpdatePartner from "@/actions/saUpdatePartner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import H2 from "@/components/adminui/H2";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";
import saGetAgentTableData from "@/actions/saGetAgentTableData";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  domain: z.string().nonempty("Domain is required"),
  coreDomain: z.string().optional(),
  openAiApiKey: z.string().optional(),
  sendEmailFromDomain: z.string().optional(),
  salesBotName: z.string().optional(),
  legalName: z.string().optional(),
  companyNumber: z.string().optional(),
  registeredAddress: z.string().optional(),
  legalEmail: z.string().optional(),
  goCardlessMandateLink: z.string().optional(),
  salesEmail: z.string().optional(),
  accountsEmail: z.string().optional(),
  organisationId: z.string().optional(),
  prototypingAgentId: z.string().optional(),
  hourlyRate: z.string().optional(),
  monthlyBaseFee: z.string().optional(),
  monthlyPerIntegration: z.string().optional(),
});

export default function EditPartnerForm({
  partnerId,
  name,
  domain,
  coreDomain,
  openAiApiKey,
  sendEmailFromDomain,
  salesBotName,
  legalName,
  companyNumber,
  registeredAddress,
  legalEmail,
  goCardlessMandateLink,
  salesEmail,
  accountsEmail,
  organisationId,
  organisationName,
  prototypingAgentId,
  prototypingAgentLabel,
  hourlyRate,
  monthlyBaseFee,
  monthlyPerIntegration,
}: {
  partnerId: string;
  name?: string;
  domain?: string;
  coreDomain?: string;
  openAiApiKey?: string;
  sendEmailFromDomain?: string;
  salesBotName?: string;
  legalName?: string;
  companyNumber?: string;
  registeredAddress?: string;
  legalEmail?: string;
  goCardlessMandateLink?: string;
  salesEmail?: string;
  accountsEmail?: string;
  organisationId?: string | null;
  organisationName?: string;
  prototypingAgentId?: string | null;
  prototypingAgentLabel?: string;
  hourlyRate?: number | null;
  monthlyBaseFee?: number | null;
  monthlyPerIntegration?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: name || "",
      domain: domain || "",
      coreDomain: coreDomain || "",
      openAiApiKey: openAiApiKey || "",
      sendEmailFromDomain: sendEmailFromDomain || "",
      salesBotName: salesBotName || "",
      legalName: legalName || "",
      companyNumber: companyNumber || "",
      registeredAddress: registeredAddress || "",
      legalEmail: legalEmail || "",
      goCardlessMandateLink: goCardlessMandateLink || "",
      salesEmail: salesEmail || "",
      accountsEmail: accountsEmail || "",
      organisationId: organisationId || "",
      prototypingAgentId: prototypingAgentId || "",
      hourlyRate: hourlyRate != null ? String(hourlyRate) : "",
      monthlyBaseFee: monthlyBaseFee != null ? String(monthlyBaseFee) : "",
      monthlyPerIntegration:
        monthlyPerIntegration != null ? String(monthlyPerIntegration) : "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId: partnerId,
      name: values.name,
      domain: values.domain,
      coreDomain: values.coreDomain,
      openAiApiKey: values.openAiApiKey,
      sendEmailFromDomain: values.sendEmailFromDomain,
      salesBotName: values.salesBotName,
      legalName: values.legalName,
      companyNumber: values.companyNumber,
      registeredAddress: values.registeredAddress,
      legalEmail: values.legalEmail,
      goCardlessMandateLink: values.goCardlessMandateLink,
      salesEmail: values.salesEmail,
      accountsEmail: values.accountsEmail,
      organisationId: values.organisationId || null,
      prototypingAgentId: values.prototypingAgentId || null,
      hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : null,
      monthlyBaseFee: values.monthlyBaseFee
        ? Number(values.monthlyBaseFee)
        : null,
      monthlyPerIntegration: values.monthlyPerIntegration
        ? Number(values.monthlyPerIntegration)
        : null,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      toast.error("There was an error updating the partner");
      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
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
      toast.success(`Partner ${values.name} updated`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <H2>Edit Partner</H2>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Partner Ltd" {...field} />
              </FormControl>
              {/* <FormDescription>Give the user a name</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organisationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisation</FormLabel>
              <FormControl>
                <RemoteSelect
                  {...field}
                  serverAction={saGetOrganisationTableData}
                  label={(record) => `${record.name}`}
                  valueField="id"
                  sortField="name"
                  placeholder="Select an organisation..."
                  emptyMessage="No organisations found"
                  initialLabel={organisationName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domain"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <Input placeholder="partner.com" {...field} />
              </FormControl>
              {/* <FormDescription>Give the user a name</FormDescription> */}
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
              <FormControl>
                <Input placeholder="corepartner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openAiApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OpenAI API Key</FormLabel>
              <FormControl>
                <Input placeholder="sk-..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <H2>Email Settings</H2>

        <FormField
          control={form.control}
          name="sendEmailFromDomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Send Email From Domain</FormLabel>
              <FormControl>
                <Input placeholder="mail.partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salesEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Email</FormLabel>
              <FormControl>
                <Input placeholder="sales@partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountsEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accounts Email</FormLabel>
              <FormControl>
                <Input placeholder="accounts@partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <H2>Prototyping</H2>

        <FormField
          control={form.control}
          name="prototypingAgentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prototyping Agent</FormLabel>
              <FormControl>
                <RemoteSelect
                  {...field}
                  serverAction={saGetAgentTableData}
                  label={(record) =>
                    `${record.organisationName || "No Organisation"} - ${record.niceName || record.name}`
                  }
                  valueField="id"
                  sortField="niceName"
                  placeholder="Select a prototyping agent..."
                  emptyMessage="No agents found"
                  initialLabel={prototypingAgentLabel}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <H2>Sales Bot</H2>

        <FormField
          control={form.control}
          name="salesBotName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Bot Name</FormLabel>
              <FormControl>
                <Input placeholder="Sales Assistant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <H2>Legal Information</H2>

        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Name</FormLabel>
              <FormControl>
                <Input placeholder="Partner Ltd" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Number</FormLabel>
              <FormControl>
                <Input placeholder="12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registeredAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registered Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street, London, SW1A 1AA"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Email</FormLabel>
              <FormControl>
                <Input placeholder="legal@partner.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <H2>Pricing</H2>

        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate (£)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyBaseFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Base Fee (£)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="150" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyPerIntegration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Per Integration (£)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <H2>Payment</H2>

        <FormField
          control={form.control}
          name="goCardlessMandateLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GoCardless Mandate Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://pay.gocardless.com/..."
                  {...field}
                />
              </FormControl>
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
          Submit
        </Button>
      </form>
    </Form>
  );
}
