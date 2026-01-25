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
import { Sparkles, AlertCircle } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SimpleMarkdownEditor } from "@/components/SimpleMarkdownEditor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  proposalPersonalMessage: z.string().optional(),
  generatedProposalIntroduction: z.string().optional(),
  generatedSpecification: z.string().optional(),
});

export default function EditProposalForm({
  quoteId,
  proposalPersonalMessage,
  generatedProposalIntroduction,
  generatedSpecification,
}: {
  quoteId: string;
  proposalPersonalMessage: string | null;
  generatedProposalIntroduction: string | null;
  generatedSpecification: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [generationMode, setGenerationMode] = useState<"scratch" | "amend">(
    "scratch",
  );
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proposalPersonalMessage: proposalPersonalMessage || "",
      generatedProposalIntroduction: generatedProposalIntroduction || "",
      generatedSpecification: generatedSpecification || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuoteProposal({
      quoteId: quoteId,
      proposalPersonalMessage: values.proposalPersonalMessage,
      generatedProposalIntroduction: values.generatedProposalIntroduction,
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
    setShowPromptDialog(false);
    setRegenerating(true);

    const response = await saGenerateQuoteProposal({
      quoteId,
      extraPrompt: extraPrompt.trim() || undefined,
      mode: generationMode,
      existingIntroduction:
        generationMode === "amend"
          ? form.getValues("generatedProposalIntroduction")
          : undefined,
      existingSpecification:
        generationMode === "amend"
          ? form.getValues("generatedSpecification")
          : undefined,
    });

    if (!response.success) {
      toast.error(response.error || "Failed to regenerate proposal");
      setRegenerating(false);
      return;
    }

    // Update form values with new content
    form.setValue(
      "generatedProposalIntroduction",
      response.data.generatedProposalIntroduction || "",
    );
    form.setValue(
      "generatedSpecification",
      response.data.generatedSpecification || "",
    );

    toast.success("Proposal regenerated! Review and save when ready.");
    setRegenerating(false);
    router.refresh();
  }

  const hasContent =
    form.getValues("generatedProposalIntroduction") ||
    form.getValues("generatedSpecification");

  function handleGenerateClick() {
    if (hasContent) {
      setShowConfirmDialog(true);
    } else {
      setShowPromptDialog(true);
    }
  }

  function handleConfirmReplace() {
    setShowConfirmDialog(false);
    setGenerationMode("scratch");
    setShowPromptDialog(true);
  }

  return (
    <>
      <Dialog open={regenerating} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Generating Proposal</DialogTitle>
            <DialogDescription>
              Please wait while we generate your proposal. This may take a
              minute or two...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your existing introduction and specification
              content with newly generated content. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Proposal</DialogTitle>
            <DialogDescription>
              Add optional instructions to customise how the proposal is
              generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {hasContent && (
              <div className="space-y-2">
                <Label htmlFor="generation-mode">Generation Mode</Label>
                <Select
                  value={generationMode}
                  onValueChange={(value: "scratch" | "amend") =>
                    setGenerationMode(value)
                  }
                >
                  <SelectTrigger id="generation-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scratch">
                      Generate from scratch
                    </SelectItem>
                    <SelectItem value="amend">Amend the existing</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {generationMode === "scratch"
                    ? "This will replace the existing proposal with entirely new content."
                    : "This will modify the existing proposal based on your instructions."}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="extra-prompt">
                {generationMode === "amend"
                  ? "Amendment Instructions"
                  : "Additional Instructions"}
              </Label>
              <Textarea
                id="extra-prompt"
                placeholder={
                  generationMode === "amend"
                    ? "e.g. make the tone more formal, add more focus on security features"
                    : "e.g. write the proposal for a non-technical layman"
                }
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {generationMode === "amend"
                  ? "Describe how you want the existing proposal to be modified."
                  : "This is optional. Leave blank to use the default generation."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPromptDialog(false);
                setExtraPrompt("");
                setGenerationMode("scratch");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={regenerateProposal}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="proposalPersonalMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a personal message to include at the top of the proposal..."
                    {...field}
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Optionally, add a personal message to the proposal.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {!hasContent && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No proposal generated yet</AlertTitle>
              <AlertDescription>
                The proposal will be automatically generated when you save the
                specification. You can also click the button below to generate
                it now.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateClick}
              disabled={regenerating}
            >
              {regenerating ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate with AI
            </Button>
          </div>

          <FormField
            control={form.control}
            name="generatedProposalIntroduction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Introduction</FormLabel>
                <FormControl>
                  <SimpleMarkdownEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Enter the introduction..."
                  />
                </FormControl>
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
                <FormLabel>Detailed Specification</FormLabel>
                <FormControl>
                  <SimpleMarkdownEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Enter the detailed specification..."
                  />
                </FormControl>
                <FormDescription>
                  A comprehensive, professional specification that expands on
                  the client's requirements.
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
    </>
  );
}
