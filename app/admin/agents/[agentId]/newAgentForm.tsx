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
import { saCreateAgent } from "@/actions/saCreateAgent";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  niceName: z.string().nonempty("Nice Name is required"),
  openAiApiKey: z.string().optional(),
});

export default function NewAgentForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      niceName: "",
      openAiApiKey: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateAgent({
      name: values.name,
      niceName: values.niceName,
      openAiApiKey: values.openAiApiKey,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      if (!response.success) {
        toast.error("There was an error creating the agent");

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
      toast.success(`Agent ${values.name} created`);
      router.push(`/admin/agents/${response.data.id}`);
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
                <Input placeholder="Acme Inc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="niceName"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nice Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Sales Assistant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openAiApiKey"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>OpenAI API Key</FormLabel>
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
          Submit
        </Button>
      </form>
    </Form>
  );
}
