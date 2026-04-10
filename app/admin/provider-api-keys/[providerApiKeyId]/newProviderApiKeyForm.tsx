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
import { saCreateProviderApiKey } from "@/actions/saCreateProviderApiKey";
import saGetProviderTableData from "@/actions/saGetProviderTableData";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";

const formSchema = z.object({
  key: z.string().min(1, "API key is required"),
  providerId: z.string().min(1, "Provider is required"),
  organisationId: z.string().min(1, "Organisation is required"),
});

export default function NewProviderApiKeyForm({
  preselectedOrganisationId,
  preselectedOrganisationName,
}: {
  preselectedOrganisationId?: string;
  preselectedOrganisationName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
      providerId: "",
      organisationId: preselectedOrganisationId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateProviderApiKey({
      key: values.key,
      providerId: values.providerId,
      organisationId: values.organisationId,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error creating the key");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
      return;
    }

    toast.success("Provider API key created");
    router.push(`/admin/provider-api-keys/${response.data.id}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  label={(record) => record.name}
                  valueField="id"
                  sortField="name"
                  placeholder="Select an organisation..."
                  emptyMessage="No organisations found"
                  initialLabel={preselectedOrganisationName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          Create
        </Button>
      </form>
    </Form>
  );
}
