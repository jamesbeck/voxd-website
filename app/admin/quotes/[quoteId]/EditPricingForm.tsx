"use client";

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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import saUpdateQuotePricing from "@/actions/saUpdateQuotePricing";

const formSchema = z.object({
  setupFee: z.string(),
  monthlyFee: z.string(),
  setupFeeVoxdCost: z.string(),
  monthlyFeeVoxdCost: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditPricingForm({
  quoteId,
  setupFee,
  monthlyFee,
  setupFeeVoxdCost,
  monthlyFeeVoxdCost,
  isAdmin,
  isOwnerPartner,
}: {
  quoteId: string;
  setupFee: number | null;
  monthlyFee: number | null;
  setupFeeVoxdCost: number | null;
  monthlyFeeVoxdCost: number | null;
  isAdmin: boolean;
  isOwnerPartner: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canEditPartnerFields = isOwnerPartner || isAdmin;
  const canEditAdminFields = isAdmin;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      setupFee: setupFee?.toString() ?? "",
      monthlyFee: monthlyFee?.toString() ?? "",
      setupFeeVoxdCost: setupFeeVoxdCost?.toString() ?? "",
      monthlyFeeVoxdCost: monthlyFeeVoxdCost?.toString() ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    // Convert string values to numbers (or null if empty)
    const parseValue = (val: string) => (val === "" ? null : Number(val));

    const response = await saUpdateQuotePricing({
      quoteId: quoteId,
      setupFee: parseValue(values.setupFee),
      monthlyFee: parseValue(values.monthlyFee),
      setupFeeVoxdCost: parseValue(values.setupFeeVoxdCost),
      monthlyFeeVoxdCost: parseValue(values.monthlyFeeVoxdCost),
    });

    if (!response.success) {
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the quote pricing");

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
      toast.success("Quote pricing updated");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Partner editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="setupFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setup Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <FormDescription>
                  One-time setup fee charged to the customer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlyFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    disabled={!canEditPartnerFields}
                  />
                </FormControl>
                <FormDescription>
                  Recurring monthly fee charged to the customer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Admin-only editable fields (visible to partners but not editable) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="setupFeeVoxdCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setup Fee (Voxd Cost)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    disabled={!canEditAdminFields}
                  />
                </FormControl>
                <FormDescription>
                  Voxd&apos;s cost for setup (Voxd only)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlyFeeVoxdCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Fee (Voxd Cost)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    disabled={!canEditAdminFields}
                  />
                </FormControl>
                <FormDescription>
                  Voxd&apos;s monthly cost (Voxd only)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {canEditPartnerFields && (
          <Button type="submit" disabled={loading}>
            {loading && <Spinner className="mr-2" />}
            Save Pricing
          </Button>
        )}
      </form>
    </Form>
  );
}
