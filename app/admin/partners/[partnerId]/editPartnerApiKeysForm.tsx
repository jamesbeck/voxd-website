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
import saUpdatePartner from "@/actions/saUpdatePartner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetProviderApiKeyTableData from "@/actions/saGetProviderApiKeyTableData";

const formSchema = z.object({
  providerApiKeyId: z.string().optional(),
});

export default function EditPartnerApiKeysForm({
  partnerId,
  providerApiKeyId,
  providerApiKeyLabel,
}: {
  partnerId: string;
  providerApiKeyId?: string;
  providerApiKeyLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerApiKeyId: providerApiKeyId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId,
      providerApiKeyId: values.providerApiKeyId,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the partner");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
    }

    if (response.success) {
      toast.success("Partner API keys updated");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="providerApiKeyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider API Key</FormLabel>
              <FormControl>
                <RemoteSelect
                  {...field}
                  serverAction={saGetProviderApiKeyTableData}
                  label={(record) =>
                    `${record.providerName} \u2014 ${record.key && record.key.length > 12 ? `${record.key.slice(0, 6)}...${record.key.slice(-4)}` : "***"}${record.organisationName ? ` (${record.organisationName})` : ""}`
                  }
                  valueField="id"
                  sortField="providerName"
                  placeholder="Select a provider API key..."
                  emptyMessage="No provider API keys found"
                  initialLabel={providerApiKeyLabel}
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
          Save
        </Button>
      </form>
    </Form>
  );
}
