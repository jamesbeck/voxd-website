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
import { saUpdateOrganisation } from "@/actions/saUpdateOrganisation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { RemoteMultiSelect } from "@/components/inputs/RemoteMultiSelect";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  partnerId: z.string().optional(),
  adminUserIds: z.string().array(),
});

export default function NewOrganisationForm({
  organisationId,
  name,
  partnerId,
  adminUserIds,
  isAdmin,
}: {
  organisationId: string;
  name?: string;
  partnerId?: string;
  adminUserIds?: string[];
  isAdmin?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: name || "",
      partnerId: partnerId || "",
      adminUserIds: adminUserIds || [],
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateOrganisation({
      organisationId: organisationId,
      name: values.name,
      partnerId: values.partnerId,
      adminUserIds: values.adminUserIds,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      if (!response.success) {
        toast.error("There was an error updating the organisation");

        if (response.error) {
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
    }

    if (response.success) {
      toast.success(`Organisation ${values.name} updated`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Joe Bloggs Ltd" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAdmin && (
          <FormField
            control={form.control}
            name="partnerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partner (Optional)</FormLabel>
                <FormControl>
                  <RemoteSelect
                    {...field}
                    serverAction={saGetPartnerTableData}
                    label={(record) => `${record.name}`}
                    valueField="id"
                    sortField="name"
                    placeholder="Select a partner..."
                    emptyMessage="No partners found"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="adminUserIds"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Users</FormLabel>
              <FormControl>
                <RemoteMultiSelect
                  {...field}
                  serverAction={saGetAdminUserTableData}
                  label={(record) =>
                    `${record.name} (${[record.number, record.email]
                      .filter(Boolean)
                      .join(" / ")})`
                  }
                  valueField="id"
                  sortField="name"
                  placeholder="Search and select users..."
                  emptyMessage="No users found"
                  pageSize={50}
                  searchDebounceMs={300}
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
          Submit
        </Button>
      </form>
    </Form>
  );
}
