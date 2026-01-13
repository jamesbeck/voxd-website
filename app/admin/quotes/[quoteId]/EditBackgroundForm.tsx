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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import saUpdateQuoteBackground from "@/actions/saUpdateQuoteBackground";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  background: z.string().optional(),
});

export default function EditBackgroundForm({
  quoteId,
  background,
}: {
  quoteId: string;
  background: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background: background || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuoteBackground({
      quoteId: quoteId,
      background: values.background,
    });

    if (!response.success) {
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the background");

        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
    }

    if (response.success) {
      toast.success("Background updated successfully");
      router.refresh();
    }

    setLoading(false);
  }

  const hasContent = form.getValues("background");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!hasContent && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No background content yet</AlertTitle>
            <AlertDescription>
              Add company background and context for the project. This helps set
              the stage for the proposal.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="background"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Background (Markdown)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {showPreview ? (
                <div className="min-h-[300px] rounded-md border bg-muted/30 p-4">
                  {field.value ? (
                    <MarkdownContent content={field.value} />
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No background content yet. Click Edit to add one.
                    </p>
                  )}
                </div>
              ) : (
                <FormControl>
                  <Textarea
                    placeholder="Enter the background using Markdown formatting..."
                    {...field}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </FormControl>
              )}
              <FormDescription>
                Company background and context for the project. Use Markdown for
                formatting.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="max-w-xl">
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading && <Spinner className="mr-2" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
