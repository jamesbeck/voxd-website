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
import saGetAgentTableData from "@/actions/saGetAgentTableData";

const formSchema = z.object({
  prototypingAgentId: z.string().optional(),
});

export default function EditPartnerPrototypingForm({
  partnerId,
  prototypingAgentId,
  prototypingAgentLabel,
}: {
  partnerId: string;
  prototypingAgentId?: string | null;
  prototypingAgentLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prototypingAgentId: prototypingAgentId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdatePartner({
      partnerId,
      prototypingAgentId: values.prototypingAgentId || null,
    });

    if (!response.success) {
      setLoading(false);
      toast.error("There was an error updating the partner");
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
    }

    if (response.success) {
      toast.success("Partner prototyping settings updated");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="prototypingAgentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prototyping Agent</FormLabel>
              <FormControl>
                <RemoteSelect
                  {...field}
                  serverAction={saGetAgentTableData}
                  label={(record) =>
                    `${record.organisationName || "No Organisation"} - ${record.niceName || record.name}`
                  }
                  valueField="id"
                  sortField="niceName"
                  placeholder="Select a prototyping agent..."
                  emptyMessage="No agents found"
                  initialLabel={prototypingAgentLabel}
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
