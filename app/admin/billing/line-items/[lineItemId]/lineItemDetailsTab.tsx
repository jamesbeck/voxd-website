"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import saUpdateInvoiceLineItem from "@/actions/saUpdateInvoiceLineItem";

const formSchema = z.object({
  invoiceId: z.string().optional(),
  agentId: z.string().min(1),
  toOrganisationId: z.string().min(1),
  fromPartnerId: z.string().min(1),
  toPartnerId: z.string().optional(),
  serviceFromDate: z.string().min(1),
  serviceToDate: z.string().min(1),
  quantity: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().int(),
  VAT: z.coerce.number().int(),
});

const formatDateInput = (value?: string | Date | null) => {
  if (!value) return "";

  return new Date(value).toISOString().slice(0, 10);
};

export default function LineItemDetailsTab({
  lineItem,
  canEdit,
}: {
  lineItem: any;
  canEdit: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<
    z.input<typeof formSchema>,
    any,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceId: lineItem.invoiceId || "",
      agentId: lineItem.agentId,
      toOrganisationId: lineItem.toOrganisationId,
      fromPartnerId: lineItem.fromPartnerId,
      toPartnerId: lineItem.toPartnerId || "",
      serviceFromDate: formatDateInput(lineItem.serviceFromDate),
      serviceToDate: formatDateInput(lineItem.serviceToDate),
      quantity: String(lineItem.quantity),
      description: lineItem.description,
      amount: lineItem.amount,
      VAT: lineItem.VAT,
    },
  });

  async function onSubmit(values: z.output<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateInvoiceLineItem({
      lineItemId: lineItem.id,
      ...values,
    });

    if (!response.success) {
      setLoading(false);
      toast.error(
        response.error || "There was an error updating the line item",
      );
      return;
    }

    toast.success("Line item updated");
    setLoading(false);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice ID</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent ID</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toOrganisationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Organisation ID</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fromPartnerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Partner ID</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toPartnerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Partner ID</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceFromDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service From</FormLabel>
                <FormControl>
                  <Input type="date" disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceToDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service To</FormLabel>
                <FormControl>
                  <Input type="date" disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input disabled={!canEdit} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (pence)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={!canEdit}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={String(field.value ?? "")}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="VAT"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT (pence)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={!canEdit}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={String(field.value ?? "")}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {canEdit ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
