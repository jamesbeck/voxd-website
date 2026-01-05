"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import saUpdateQuoteSpecification from "@/actions/saUpdateQuoteSpecification";

const formSchema = z.object({
  background: z.string().optional(),
  objectives: z.string().optional(),
  dataSources: z.string().optional(),
  integrationRequirements: z.string().optional(),
  otherNotes: z.string().optional(),
});

export default function EditSpecificationForm({
  quoteId,
  background,
  objectives,
  dataSources,
  integrationRequirements,
  otherNotes,
}: {
  quoteId: string;
  background: string | null;
  objectives: string | null;
  dataSources: string | null;
  integrationRequirements: string | null;
  otherNotes: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background: background || "",
      objectives: objectives || "",
      dataSources: dataSources || "",
      integrationRequirements: integrationRequirements || "",
      otherNotes: otherNotes || "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuoteSpecification({
      quoteId: quoteId,
      background: values.background,
      objectives: values.objectives,
      dataSources: values.dataSources,
      integrationRequirements: values.integrationRequirements,
      otherNotes: values.otherNotes,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the quote");

        if (response.error)
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
      toast.success(`Quote ${quoteId} updated`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="background"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} className="h-[150px]" />
              </FormControl>
              <FormDescription>
                Company background and context for the project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objectives</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} className="h-[150px]" />
              </FormControl>
              <FormDescription>
                What the client wants to achieve with the chatbot
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataSources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Sources</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} className="h-[150px]" />
              </FormControl>
              <FormDescription>
                What data sources will the chatbot need to access? Examples
                include client-supplied documents, manually created knowledge
                base, CRM and back office systems.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="integrationRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Integration Requirements</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} className="h-[150px]" />
              </FormControl>
              <FormDescription>
                What systems or APIs need to be integrated? Examples include CRM
                systems, accountancy packages, or bespoke external systems.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otherNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Other Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} className="h-[150px]" />
              </FormControl>
              <FormDescription>
                Any other relevant information or requirements
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          {form.formState.errors.root && (
            <p className="text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          Save & Generate Proposal
        </Button>
      </form>
    </Form>
  );
}
