"use client";

import { useState } from "react";
import { AlertCircleIcon, InfoIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import saUpdatePartner from "@/actions/saUpdatePartner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  defaultSubPartnerMarkupSetupFee: z.string().optional(),
  defaultSubPartnerMarkupMonthlyFee: z.string().optional(),
  defaultSubPartnerMarkupHourlyRate: z.string().optional(),
});

export default function EditSubPartnerMarkupForm({
  partnerId,
  defaultSubPartnerMarkupSetupFee,
  defaultSubPartnerMarkupMonthlyFee,
  defaultSubPartnerMarkupHourlyRate,
}: {
  partnerId: string;
  defaultSubPartnerMarkupSetupFee?: number | null;
  defaultSubPartnerMarkupMonthlyFee?: number | null;
  defaultSubPartnerMarkupHourlyRate?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultSubPartnerMarkupSetupFee:
        defaultSubPartnerMarkupSetupFee != null
          ? String(defaultSubPartnerMarkupSetupFee)
          : "",
      defaultSubPartnerMarkupMonthlyFee:
        defaultSubPartnerMarkupMonthlyFee != null
          ? String(defaultSubPartnerMarkupMonthlyFee)
          : "",
      defaultSubPartnerMarkupHourlyRate:
        defaultSubPartnerMarkupHourlyRate != null
          ? String(defaultSubPartnerMarkupHourlyRate)
          : "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId,
      defaultSubPartnerMarkupSetupFee: values.defaultSubPartnerMarkupSetupFee
        ? Number(values.defaultSubPartnerMarkupSetupFee)
        : null,
      defaultSubPartnerMarkupMonthlyFee: values.defaultSubPartnerMarkupMonthlyFee
        ? Number(values.defaultSubPartnerMarkupMonthlyFee)
        : null,
      defaultSubPartnerMarkupHourlyRate: values.defaultSubPartnerMarkupHourlyRate
        ? Number(values.defaultSubPartnerMarkupHourlyRate)
        : null,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating sub-partner pricing");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
      return;
    }

    toast.success("Sub-partner pricing updated");
    router.refresh();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Default sub-partner markup</AlertTitle>
          <AlertDescription>
            These are the default markup multipliers applied to your
            sub-partners quotes. This is the margin you will earn on those
            agents. Enter decimal values, so 1.2 means a 20% markup.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="defaultSubPartnerMarkupSetupFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setup Fee Markup Multiplier</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="1.20" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultSubPartnerMarkupMonthlyFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Fee Markup Multiplier</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="1.20" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultSubPartnerMarkupHourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate Markup Multiplier</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="1.20" {...field} />
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