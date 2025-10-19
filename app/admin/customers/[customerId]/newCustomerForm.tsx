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
import { saCreateCustomer } from "@/actions/saCreateCustomer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { RemoteMultiSelect } from "@/components/inputs/RemoteMultiSelect";
import saGetUserTableData from "@/actions/saGetUserTableData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  userIds: z.string().array(),
});

export default function NewCustomerForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      userIds: [],
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateCustomer({
      name: values.name,
      userIds: values.userIds,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      if (!response.success) {
        toast.error("There was an error creating the customer");

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
      toast.success(`Customer ${values.name} created`);
      router.push(`/admin/customers/${response.data.id}`);
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

        <FormField
          control={form.control}
          name="userIds"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Users</FormLabel>
              <FormControl>
                <RemoteMultiSelect
                  {...field}
                  serverAction={saGetUserTableData}
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
