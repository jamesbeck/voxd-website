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
import { useState, useCallback, useRef, useEffect } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import saUpdateQuoteSpecification from "@/actions/saUpdateQuoteSpecification";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

const formSchema = z.object({
  objectives: z.string().optional(),
  dataSourcesAndIntegrations: z.string().optional(),
  otherNotes: z.string().optional(),
});

export default function EditSpecificationForm({
  quoteId,
  objectives,
  dataSourcesAndIntegrations,
  otherNotes,
  status,
  isSuperAdmin = false,
}: {
  quoteId: string;
  objectives: string | null;
  dataSourcesAndIntegrations: string | null;
  otherNotes: string | null;
  status: string;
  isSuperAdmin?: boolean;
}) {
  const isReadOnly =
    !isSuperAdmin && status !== "Draft" && status !== "Concept Sent to Client";
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectives: objectives || "",
      dataSourcesAndIntegrations: dataSourcesAndIntegrations || "",
      otherNotes: otherNotes || "",
    },
  });

  // Save function
  const saveChanges = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setSaving(true);

      const response = await saUpdateQuoteSpecification({
        quoteId: quoteId,
        objectives: values.objectives,
        dataSourcesAndIntegrations: values.dataSourcesAndIntegrations,
        otherNotes: values.otherNotes,
      });

      if (!response.success) {
        if (response.error) {
          toast.error("There was an error saving changes");

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
        router.refresh();
      }

      setSaving(false);
    },
    [quoteId, form, router],
  );

  // Debounced save handler
  const debouncedSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const values = form.getValues();
      saveChanges(values);
    }, 1000);
  }, [form, saveChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Form {...form}>
      <form className="space-y-8">
        {isReadOnly && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Read Only</AlertTitle>
            <AlertDescription>
              The specification cannot be edited because this quote has already
              been submitted for pricing. To make changes, the quote must be put
              back into Draft status.
            </AlertDescription>
          </Alert>
        )}

        {!isReadOnly && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              Auto-save enabled
              {saving && <Spinner className="h-4 w-4" />}
            </AlertTitle>
            <AlertDescription>
              Changes are saved automatically as you type.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="objectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objectives</FormLabel>
              <FormControl>
                <Textarea
                  placeholder=""
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!isReadOnly) debouncedSave();
                  }}
                  className="h-[150px]"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
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
          name="dataSourcesAndIntegrations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Sources & Integrations</FormLabel>
              <FormControl>
                <Textarea
                  placeholder=""
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!isReadOnly) debouncedSave();
                  }}
                  className="h-[150px]"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormDescription>
                What data sources will the chatbot need to access and what
                systems or APIs need to be integrated? Examples include
                client-supplied documents, manually created knowledge base, CRM
                systems, accountancy packages, back office systems, or bespoke
                external systems.
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
                <Textarea
                  placeholder=""
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!isReadOnly) debouncedSave();
                  }}
                  className="h-[150px]"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
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
      </form>
    </Form>
  );
}
