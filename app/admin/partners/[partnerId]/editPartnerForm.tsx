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

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  domain: z.string().nonempty("Domain is required"),
  colour: z.string().nonempty("Colour is required"),
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
});

export default function EditPartnerForm({
  partnerId,
  name,
  domain,
  colour,
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
}: {
  partnerId: string;
  name?: string;
  domain?: string;
  colour?: string;
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
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: name || "",
      domain: domain || "",
      colour: colour || "",
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
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId: partnerId,
      name: values.name,
      domain: values.domain,
      colour: values.colour,
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
          name="colour"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour</FormLabel>
              <FormControl>
                <Input placeholder="#000000" {...field} />
              </FormControl>
              {/* <FormDescription>Give the user a name</FormDescription> */}
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
