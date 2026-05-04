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

const formSchema = z.object({
  hourlyRate: z.string().optional(),
  monthlyBaseFee: z.string().optional(),
  monthlyPerIntegration: z.string().optional(),
});

export default function EditPartnerPricingForm({
  partnerId,
  hourlyRate,
  monthlyBaseFee,
  monthlyPerIntegration,
}: {
  partnerId: string;
  hourlyRate?: number | null;
  monthlyBaseFee?: number | null;
  monthlyPerIntegration?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hourlyRate: hourlyRate != null ? String(hourlyRate) : "",
      monthlyBaseFee: monthlyBaseFee != null ? String(monthlyBaseFee) : "",
      monthlyPerIntegration:
        monthlyPerIntegration != null ? String(monthlyPerIntegration) : "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId,
      hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : null,
      monthlyBaseFee: values.monthlyBaseFee
        ? Number(values.monthlyBaseFee)
        : null,
      monthlyPerIntegration: values.monthlyPerIntegration
        ? Number(values.monthlyPerIntegration)
        : null,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the partner");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
    }

    if (response.success) {
      toast.success("Partner pricing updated");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
