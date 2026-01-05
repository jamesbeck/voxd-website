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
import saUpdateQuoteProposal from "@/actions/saUpdateQuoteProposal";
import saGenerateQuoteProposal from "@/actions/saGenerateQuoteProposal";
import { Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  generatedIntroduction: z.string().optional(),
  generatedSpecification: z.string().optional(),
});

export default function EditProposalForm({
  quoteId,
  generatedIntroduction,
  generatedSpecification,
}: {
  quoteId: string;
  generatedIntroduction: string | null;
  generatedSpecification: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showIntroPreview, setShowIntroPreview] = useState(true);
  const [showSpecPreview, setShowSpecPreview] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generatedIntroduction: generatedIntroduction || "",
      generatedSpecification: generatedSpecification || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuoteProposal({
      quoteId: quoteId,
      generatedIntroduction: values.generatedIntroduction,
      generatedSpecification: values.generatedSpecification,
    });

    if (!response.success) {
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the proposal");

        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
    }

    if (response.success) {
      toast.success("Proposal updated successfully");
      router.refresh();
    }

    setLoading(false);
  }

  async function regenerateProposal() {
    setRegenerating(true);

    const response = await saGenerateQuoteProposal({ quoteId });

    if (!response.success) {
      toast.error(response.error || "Failed to regenerate proposal");
      setRegenerating(false);
      return;
    }

    // Update form values with new content
    form.setValue(
      "generatedIntroduction",
      response.data.generatedIntroduction || ""
    );
    form.setValue(
      "generatedSpecification",
      response.data.generatedSpecification || ""
    );

    toast.success("Proposal regenerated! Review and save when ready.");
    setRegenerating(false);
    router.refresh();
  }

  const hasContent =
    form.getValues("generatedIntroduction") ||
    form.getValues("generatedSpecification");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!hasContent && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No proposal generated yet</AlertTitle>
            <AlertDescription>
              The proposal will be automatically generated when you save the
              specification. You can also click the button below to generate it
              now.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={regenerateProposal}
            disabled={regenerating}
          >
            {regenerating ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {hasContent ? "Regenerate with AI" : "Generate with AI"}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="generatedIntroduction"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Introduction (Markdown)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIntroPreview(!showIntroPreview)}
                >
                  {showIntroPreview ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showIntroPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {showIntroPreview ? (
                <div className="min-h-[150px] rounded-md border bg-muted/30 p-4">
                  {field.value ? (
                    <MarkdownContent content={field.value} />
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No introduction content yet. Generate or add one above.
                    </p>
                  )}
                </div>
              ) : (
                <FormControl>
                  <Textarea
                    placeholder="Enter the introduction using Markdown formatting..."
                    {...field}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </FormControl>
              )}
              <FormDescription>
                A warm, professional introduction that welcomes the client and
                sets the stage for the proposal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="generatedSpecification"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Detailed Specification (Markdown)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpecPreview(!showSpecPreview)}
                >
                  {showSpecPreview ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showSpecPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {showSpecPreview ? (
                <div className="min-h-[300px] rounded-md border bg-muted/30 p-4">
                  {field.value ? (
                    <MarkdownContent content={field.value} />
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No specification content yet. Generate or add one above.
                    </p>
                  )}
                </div>
              ) : (
                <FormControl>
                  <Textarea
                    placeholder="Enter the detailed specification using Markdown formatting..."
                    {...field}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </FormControl>
              )}
              <FormDescription>
                A comprehensive, professional specification that expands on the
                client's requirements.
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
