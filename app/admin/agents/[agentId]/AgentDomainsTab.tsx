"use client";

import saUpdateAgentDomains from "@/actions/saUpdateAgentDomains";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  domains: z.array(z.string()),
  developmentDomains: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;
type DomainListField = keyof FormValues;

function getListEmptyMessage(fieldName: DomainListField) {
  if (fieldName === "domains") {
    return "No production domains configured. Webchat embed is blocked on all production domains.";
  }

  return "No development domains configured. Webchat embed is blocked on all development domains.";
}

export default function AgentDomainsTab({
  agentId,
  domains,
  developmentDomains,
}: {
  agentId: string;
  domains?: string[] | null;
  developmentDomains?: string[] | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domains: domains ?? [],
      developmentDomains: developmentDomains ?? [],
    },
  });

  const watchedDomains = useWatch({
    control: form.control,
    name: "domains",
    defaultValue: domains ?? [],
  });
  const watchedDevelopmentDomains = useWatch({
    control: form.control,
    name: "developmentDomains",
    defaultValue: developmentDomains ?? [],
  });
  const bothListsEmpty =
    watchedDomains.length === 0 && watchedDevelopmentDomains.length === 0;

  function updateListValue(
    fieldName: DomainListField,
    index: number,
    value: string,
  ) {
    const currentValues = form.getValues(fieldName);
    const nextValues = currentValues.map((currentValue, currentIndex) =>
      currentIndex === index ? value : currentValue,
    );

    form.setValue(fieldName, nextValues, {
      shouldDirty: true,
      shouldTouch: true,
    });

    form.clearErrors(fieldName);
  }

  function addListValue(fieldName: DomainListField) {
    const currentValues = form.getValues(fieldName);

    form.setValue(fieldName, [...currentValues, ""], {
      shouldDirty: true,
      shouldTouch: true,
    });

    form.clearErrors(fieldName);
  }

  function removeListValue(fieldName: DomainListField, index: number) {
    const currentValues = form.getValues(fieldName);

    form.setValue(
      fieldName,
      currentValues.filter((_, currentIndex) => currentIndex !== index),
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );

    form.clearErrors(fieldName);
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);

    const response = await saUpdateAgentDomains({
      agentId,
      domains: values.domains,
      developmentDomains: values.developmentDomains,
    });

    if (!response.success) {
      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }

      if (response.fieldErrors) {
        for (const [fieldName, message] of Object.entries(
          response.fieldErrors,
        )) {
          form.setError(fieldName as DomainListField, {
            type: "manual",
            message,
          });
        }
      }

      toast.error(response.error || "Failed to update embed domains");
      setLoading(false);
      return;
    }

    toast.success("Embed domain allowlists saved");
    router.refresh();
    setLoading(false);
  }

  function renderDomainListField({
    fieldName,
    values,
    label,
    description,
    placeholder,
    emptyMessage,
  }: {
    fieldName: DomainListField;
    values: string[];
    label: string;
    description: string;
    placeholder: string;
    emptyMessage: string;
  }) {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={() => (
          <FormItem className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1">
              <FormLabel>{label}</FormLabel>
              <FormDescription>{description}</FormDescription>
            </div>

            {values.length > 0 ? (
              <div className="space-y-3">
                {values.map((value, index) => (
                  <div
                    key={`${fieldName}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <FormControl>
                      <Input
                        value={value}
                        placeholder={placeholder}
                        onChange={(event) =>
                          updateListValue(fieldName, index, event.target.value)
                        }
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => removeListValue(fieldName, index)}
                      aria-label={`Remove ${label} entry ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Whitelist empty</AlertTitle>
                <AlertDescription>
                  <p>{emptyMessage}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Use bare hostnames only, such as `example.com`,
                `app.example.com`, or `localhost`.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListValue(fieldName)}
              >
                <Plus className="h-4 w-4" />
                Add Domain
              </Button>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Embed allowlists</AlertTitle>
        <AlertDescription>
          <p>
            `domains` controls production embeds. `developmentDomains` controls
            local, staging, and other non-production embeds.
          </p>
          <p>
            Empty lists are treated as blocked. If a list has no entries, the
            webchat should not be embeddable in that environment.
          </p>
        </AlertDescription>
      </Alert>

      {bothListsEmpty && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Embedding currently blocked everywhere</AlertTitle>
          <AlertDescription>
            <p>
              Both allowlists are empty, so the webchat is blocked on all
              domains until you add at least one hostname.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderDomainListField({
            fieldName: "domains",
            values: watchedDomains,
            label: "Production Domains",
            description:
              "Domains where the production webchat embed is allowed to run.",
            placeholder: "example.com",
            emptyMessage: getListEmptyMessage("domains"),
          })}

          {renderDomainListField({
            fieldName: "developmentDomains",
            values: watchedDevelopmentDomains,
            label: "Development Domains",
            description:
              "Domains allowed for local development, staging, and other non-production embeds.",
            placeholder: "localhost",
            emptyMessage: getListEmptyMessage("developmentDomains"),
          })}

          {form.formState.errors.root && (
            <div className="max-w-xl">
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading && <Spinner />}
            Save Domain Allowlists
          </Button>
        </form>
      </Form>
    </div>
  );
}
