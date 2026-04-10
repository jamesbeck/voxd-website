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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saUpdateProviderApiKey } from "@/actions/saUpdateProviderApiKey";
import saGetProviderTableData from "@/actions/saGetProviderTableData";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";

const formSchema = z.object({
  key: z.string().min(1, "API key is required"),
  providerId: z.string().min(1, "Provider is required"),
});

export default function EditProviderApiKeyForm({
  providerApiKeyId,
  currentKey,
  providerId,
  providerName,
}: {
  providerApiKeyId: string;
  currentKey: string;
  providerId: string;
  providerName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: currentKey || "",
      providerId: providerId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateProviderApiKey({
      providerApiKeyId,
      key: values.key,
      providerId: values.providerId,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the key");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
      return;
    }

    toast.success("Provider API key updated");
    setLoading(false);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="providerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <RemoteSelect
                  {...field}
                  serverAction={saGetProviderTableData}
                  label={(record) => record.name}
                  valueField="id"
                  sortField="name"
                  placeholder="Select a provider..."
                  emptyMessage="No providers found"
                  initialLabel={providerName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input placeholder="sk-..." {...field} />
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
