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
  FormDescription,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saCreateChunk } from "@/actions/saCreateChunk";
import { Textarea } from "@/components/ui/textarea";

const MAX_CONTENT_LENGTH = 2000;

const formSchema = z.object({
  content: z
    .string()
    .nonempty("Content is required")
    .min(10, "Content must be at least 10 characters")
    .max(
      MAX_CONTENT_LENGTH,
      `Content must be at most ${MAX_CONTENT_LENGTH} characters`
    ),
  titlePath: z.string().optional(),
});

export default function NewChunkForm({
  documentId,
  agentId,
}: {
  documentId: string;
  agentId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      titlePath: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateChunk({
      documentId,
      content: values.content,
      titlePath: values.titlePath,
    });

    if (!response.success) {
      setLoading(false);

      toast.error("There was an error creating the chunk");

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
      toast.success("Chunk created with embedding");
      router.push(
        `/admin/agents/${agentId}/documents/${documentId}?tab=chunks`
      );
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="titlePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title Path</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Getting Started > Installation"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional hierarchical path to help identify the chunk&apos;s
                location within the document
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Content</FormLabel>
                <span
                  className={`text-sm ${
                    field.value.length > MAX_CONTENT_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {field.value.length} / {MAX_CONTENT_LENGTH}
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Enter the knowledge content for this chunk..."
                  className="min-h-[200px]"
                  maxLength={MAX_CONTENT_LENGTH}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The text content that will be embedded and used for semantic
                search. Keep chunks focused on a single topic for best results.
              </FormDescription>
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

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner />}
            Create Chunk
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                `/admin/agents/${agentId}/documents/${documentId}?tab=chunks`
              )
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
