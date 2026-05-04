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
import { saUpdateAdminUser } from "@/actions/saUpdateAdminUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import H2 from "@/components/adminui/H2";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  //only accept number characters including any hidden or RTL characters
  email: z.email("Invalid email address").nonempty("Email is required"),
  testingAgentId: z.string().optional(),
  organisationId: z.string().nonempty("Organisation is required"),
});

export default function EditAdminUserForm({
  adminUserId,
  name,
  email,
  organisationId,
  organisationName,
  canEditOrganisation,
  superAdmin: _superAdmin,
}: {
  adminUserId: string;
  name?: string;
  number?: string;
  email?: string;
  organisationId?: string;
  organisationName?: string;
  canEditOrganisation: boolean;
  superAdmin: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  void _superAdmin;

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: name || "",
      email: email || "",
      organisationId: organisationId || "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateAdminUser({
      adminUserId: adminUserId,
      name: values.name,
      email: values.email,
      organisationId: values.organisationId,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      toast.error("There was an error creating the user");

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

    if (response.success) {
      toast.success(`User ${values.name} updated`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <H2>Edit User</H2>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              {/* <FormDescription>Give the user a name</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              {/* <FormDescription>Put your user email here</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

        {canEditOrganisation ? (
          <FormField
            control={form.control}
            name="organisationId"
            rules={{ required: true }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organisation</FormLabel>
                <FormControl>
                  <RemoteSelect
                    {...field}
                    serverAction={saGetOrganisationTableData}
                    label={(record) => `${record.name}`}
                    valueField="id"
                    sortField="name"
                    placeholder="Select an organisation..."
                    emptyMessage="No organisations found"
                    pageSize={50}
                    searchDebounceMs={300}
                    initialLabel={organisationName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
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
                    label={(record) => `${record.name}`}
                    valueField="id"
                    sortField="name"
                    placeholder="Select an organisation..."
                    emptyMessage="No organisations found"
                    pageSize={50}
                    searchDebounceMs={300}
                    disabled
                    initialLabel={organisationName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
