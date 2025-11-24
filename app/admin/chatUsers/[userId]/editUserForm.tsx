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
import { saUpdateUser } from "@/actions/saUpdateUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import H2 from "@/components/adminui/H2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RemoteMultiSelect } from "@/components/inputs/RemoteMultiSelect";
import saGetOrganisationTableData from "@/actions/saGetOrganisationTableData";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  //only accept number characters including any hidden or RTL characters
  number: z
    .string()
    .regex(
      /^\d+$/,
      "Invalid number, it's possible that there are hidden characters, especially if you have copy and pasted this number from a contact record. Manually re-enter the number to fix this issue."
    )
    .or(z.literal("")),
  email: z.email("Invalid email address").or(z.literal("")),
  partnerId: z.string().optional(),
  testingAgentId: z.string().optional(),
  organisationIds: z.string().array(),
});

export default function EditUserForm({
  userId,
  name,
  number,
  email,
  partnerId,
  testingAgentId,
  organisationIds,
  agentOptions,
  partnerOptions,
}: {
  userId: string;
  name?: string;
  number?: string;
  email?: string;
  partnerId?: string;
  testingAgentId?: string;
  organisationIds?: string[];
  agentOptions: { value: string; label: string }[];
  partnerOptions: { value: string; label: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: name || "",
      number: number || "",
      email: email || "",
      partnerId: partnerId || "",
      testingAgentId: testingAgentId || "",
      organisationIds: organisationIds || [],
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateUser({
      userId: userId,
      name: values.name,
      number: values.number,
      email: values.email,
      testingAgentId: values.testingAgentId,
      organisationIds: values.organisationIds,
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
          name="number"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="447782123987"
                  {...field}
                  onBlur={(e) => {
                    // Keep original onBlur from react-hook-form field if present
                    field.onBlur();
                    const raw = e.target.value;
                    const sanitized = raw.replace(/[^0-9]/g, "");
                    if (sanitized !== raw) {
                      form.setValue("number", sanitized, {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </FormControl>
              {/* <FormDescription>Put your user number here</FormDescription> */}
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
          // rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partner</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Partner" />
                  </SelectTrigger>

                  <SelectContent>
                    {partnerOptions.map((partner) => (
                      <SelectItem key={partner.value} value={partner.value}>
                        {partner.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="testingAgentId"
          // rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Testing Agent</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Development Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentOptions.map((agent) => (
                      <SelectItem key={agent.value} value={agent.value}>
                        {agent.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              {/* <FormDescription>Put your user email here</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organisationIds"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisations</FormLabel>
              <FormControl>
                <RemoteMultiSelect
                  {...field}
                  serverAction={saGetOrganisationTableData}
                  label={(record) => `${record.name}`}
                  valueField="id"
                  sortField="name"
                  placeholder="Search and select organisations..."
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
