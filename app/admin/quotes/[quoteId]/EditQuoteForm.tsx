"use client";

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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import saUpdateQuote from "@/actions/saUpdateQuote";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  createdByAdminUserId: z.string().optional(),
});

export default function EditQuoteForm({
  quoteId,
  title,
  createdByAdminUserId,
}: {
  quoteId: string;
  title: string;
  createdByAdminUserId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: title || "",
      createdByAdminUserId: createdByAdminUserId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuote({
      quoteId: quoteId,
      title: values.title,
      createdByAdminUserId: values.createdByAdminUserId || undefined,
    });

    if (!response.success) {
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the quote");

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
      toast.success(`Quote updated successfully`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Quote title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="createdByAdminUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <FormControl>
                <RemoteSelect
                  {...field}
                  serverAction={saGetAdminUserTableData}
                  label={(record) =>
                    `${record.name}${record.email ? ` (${record.email})` : ""}`
                  }
                  valueField="id"
                  sortField="name"
                  placeholder="Select an owner..."
                  emptyMessage="No users found"
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
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
