"use client";
import { AlertCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { saCreateAdminUser } from "@/actions/saCreateAdminUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  //only accept number characters including any hidden or RTL characters
  email: z.email("Invalid email address").nonempty("Email is required"),
  partnerId: z.string().optional(),
  organisationId: z.string().nonempty("Organisation is required"),
});

export default function NewAdminUserForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      partnerId: "",
      organisationId: "",
    },
  });

  // Check if user has access to only one organisation and preselect it
  useEffect(() => {
    const checkOrganisations = async () => {
      const response = await saGetOrganisationTableData({
        page: 1,
        pageSize: 100,
      });

      if (response.success && response.data.length === 1) {
        form.setValue("organisationId", response.data[0].id);
      }
    };

    checkOrganisations();
  }, [form]);

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateAdminUser({
      name: values.name,
      email: values.email,
      partnerId: values.partnerId,
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
      toast.success(`User ${values.name} created`);
      router.push(`/admin/adminUsers/${response.data.id}`);
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

        <FormField
          control={form.control}
          name="partnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partner (Optional)</FormLabel>
              <FormDescription>
                Optionally assign this user to a partner.
              </FormDescription>
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

        <FormField
          control={form.control}
          name="organisationId"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisation</FormLabel>
              <FormDescription>
                Which organisation's agents do you want this user to have access
                to?
              </FormDescription>
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
