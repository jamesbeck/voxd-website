"use client";

import { AlertCircleIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import saUpdateOrganisationBilling from "@/actions/saUpdateOrganisationBilling";

const formSchema = z.object({
  billingAddress: z.string().optional(),
  billingPostcode: z.string().optional(),
  billingEmails: z.string().optional(),
  gcMandateId: z.string().optional(),
});

export default function BillingTab({
  organisationId,
  billingAddress,
  billingPostcode,
  billingEmails,
  gcMandateId,
}: {
  organisationId: string;
  billingAddress: string | null;
  billingPostcode: string | null;
  billingEmails: string | null;
  gcMandateId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billingAddress: billingAddress || "",
      billingPostcode: billingPostcode || "",
      billingEmails: billingEmails || "",
      gcMandateId: gcMandateId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateOrganisationBilling({
      organisationId,
      billingAddress: values.billingAddress || "",
      billingPostcode: values.billingPostcode || "",
      billingEmails: values.billingEmails || "",
      gcMandateId: values.gcMandateId || "",
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the billing details");

      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }

      return;
    }

    toast.success("Billing details updated successfully");
    router.refresh();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="billingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="123 Main Street\nLondon"
                  className="min-h-28"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingPostcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input placeholder="SW1A 1AA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingEmails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Emails</FormLabel>
              <FormControl>
                <Input
                  placeholder="accounts@example.com, billing@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Store one or more invoice recipients as a comma-separated list.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gcMandateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GC Mandate ID</FormLabel>
              <FormControl>
                <Input placeholder="MD123" {...field} />
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
          Save
        </Button>
      </form>
    </Form>
  );
}
