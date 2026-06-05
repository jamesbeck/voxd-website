"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import saUpdateAgentBilling from "@/actions/saUpdateAgentBilling";
import DataCard, { DataItem } from "@/components/adminui/DataCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon } from "lucide-react";

const formSchema = z.object({
  voxdMonthlyFee: z.string().optional(),
  retailMonthlyFee: z.string().optional(),
  billingStartDate: z.string().optional(),
});

const formatMoney = (value: number | null | undefined) => {
  if (value == null) {
    return "-";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const normalizeDateInputValue = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
};

const parseMoneyInput = (value: string | undefined) => {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  return Number(trimmedValue);
};

export default function BillingTab({
  agentId,
  canEdit,
  showVoxdMonthlyFee,
  voxdMonthlyFee,
  retailMonthlyFee,
  billingStartDate,
  voxdMonthlyFeeDescription,
  retailMonthlyFeeDescription,
  billingStartDateDescription,
}: {
  agentId: string;
  canEdit: boolean;
  showVoxdMonthlyFee: boolean;
  voxdMonthlyFee: number | null;
  retailMonthlyFee: number | null;
  billingStartDate: string | null;
  voxdMonthlyFeeDescription: string;
  retailMonthlyFeeDescription: string;
  billingStartDateDescription: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voxdMonthlyFee:
        showVoxdMonthlyFee && voxdMonthlyFee != null
          ? String(voxdMonthlyFee)
          : "",
      retailMonthlyFee:
        retailMonthlyFee != null ? String(retailMonthlyFee) : "",
      billingStartDate: normalizeDateInputValue(billingStartDate),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateAgentBilling({
      agentId,
      voxdMonthlyFee: parseMoneyInput(values.voxdMonthlyFee),
      retailMonthlyFee: parseMoneyInput(values.retailMonthlyFee),
      billingStartDate: values.billingStartDate?.trim() || null,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating agent billing");

      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }

      if (response.fieldErrors) {
        for (const key in response.fieldErrors) {
          form.setError(key as keyof z.infer<typeof formSchema>, {
            type: "manual",
            message: response.fieldErrors[key],
          });
        }
      }

      return;
    }

    toast.success("Agent billing updated");
    router.refresh();
    setLoading(false);
  }

  if (!canEdit) {
    const items: DataItem[] = [
      ...(showVoxdMonthlyFee
        ? [
            {
              label: "Monthly Cost Price",
              value: formatMoney(voxdMonthlyFee),
              description: voxdMonthlyFeeDescription,
              icon: <PoundSterling className="h-4 w-4" />,
            },
          ]
        : []),
      {
        label: "Monthly Fee",
        value: formatMoney(retailMonthlyFee),
        description: retailMonthlyFeeDescription,
        icon: <PoundSterling className="h-4 w-4" />,
      },
      {
        label: "Billing Start Date",
        value: formatDate(billingStartDate),
        description: billingStartDateDescription,
        icon: <Calendar className="h-4 w-4" />,
      },
    ];

    return <DataCard items={items} className="max-w-4xl" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {showVoxdMonthlyFee && (
          <FormField
            control={form.control}
            name="voxdMonthlyFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Cost Price</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="150" {...field} />
                </FormControl>
                <FormDescription>{voxdMonthlyFeeDescription}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="retailMonthlyFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Fee</FormLabel>
              <FormControl>
                <Input type="number" step="1" placeholder="250" {...field} />
              </FormControl>
              <FormDescription>{retailMonthlyFeeDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Start Date</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => field.onChange("")}
                  >
                    Clear
                  </Button>
                </div>
              </FormControl>
              <FormDescription>{billingStartDateDescription}</FormDescription>
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
