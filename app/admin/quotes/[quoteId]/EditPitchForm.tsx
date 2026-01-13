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
import saUpdateQuotePitch from "@/actions/saUpdateQuotePitch";
import saGenerateQuotePitch from "@/actions/saGenerateQuotePitch";
import { Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
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

const formSchema = z.object({
  pitchPersonalMessage: z.string().optional(),
  generatedPitchIntroduction: z.string().optional(),
  generatedPitch: z.string().optional(),
});

export default function EditPitchForm({
  quoteId,
  pitchPersonalMessage,
  generatedPitchIntroduction,
  generatedPitch,
}: {
  quoteId: string;
  pitchPersonalMessage: string | null;
  generatedPitchIntroduction: string | null;
  generatedPitch: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [showIntroPreview, setShowIntroPreview] = useState(true);
  const [showPitchPreview, setShowPitchPreview] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pitchPersonalMessage: pitchPersonalMessage || "",
      generatedPitchIntroduction: generatedPitchIntroduction || "",
      generatedPitch: generatedPitch || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuotePitch({
      quoteId: quoteId,
      pitchPersonalMessage: values.pitchPersonalMessage,
      generatedPitchIntroduction: values.generatedPitchIntroduction,
      generatedPitch: values.generatedPitch,
    });

    if (!response.success) {
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the pitch");

        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
    }

    if (response.success) {
      toast.success("Pitch updated successfully");
      router.refresh();
    }

    setLoading(false);
  }

  const hasContent =
    form.getValues("generatedPitchIntroduction") ||
    form.getValues("generatedPitch");

  async function generatePitch() {
    setShowPromptDialog(false);
    setGenerating(true);

    const response = await saGenerateQuotePitch({
      quoteId,
      extraPrompt: extraPrompt.trim() || undefined,
    });

    if (!response.success) {
      toast.error(response.error || "Failed to generate pitch");
      setGenerating(false);
      return;
    }

    // Update form values with new content
    form.setValue(
      "generatedPitchIntroduction",
      response.data.generatedPitchIntroduction || ""
    );
    form.setValue("generatedPitch", response.data.generatedPitch || "");

    toast.success("Pitch generated! Review and save when ready.");
    setGenerating(false);
    router.refresh();
  }

  function handleGenerateClick() {
    if (hasContent) {
      setShowConfirmDialog(true);
    } else {
      setShowPromptDialog(true);
    }
  }

  function handleConfirmReplace() {
    setShowConfirmDialog(false);
    setShowPromptDialog(true);
  }

  return (
    <>
      <Dialog open={generating} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Generating Pitch</DialogTitle>
            <DialogDescription>
              Please wait while we generate your pitch. This may take a minute
              or two...
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
              This will replace your existing pitch introduction and pitch
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
            <DialogTitle>Generate Pitch</DialogTitle>
            <DialogDescription>
              Add optional instructions to customise how the pitch is generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="e.g. write the pitch for a non-technical layman"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This is optional. Leave blank to use the default generation.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPromptDialog(false);
                setExtraPrompt("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={generatePitch}>
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
            name="pitchPersonalMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a personal message to include at the top of the pitch..."
                    {...field}
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Optionally, add a personal message to the pitch.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {!hasContent && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No pitch content yet</AlertTitle>
              <AlertDescription>
                Click the button below to generate a pitch using AI, or add
                content manually.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateClick}
              disabled={generating}
            >
              {generating ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate with AI
            </Button>
          </div>

          <FormField
            control={form.control}
            name="generatedPitchIntroduction"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Pitch Introduction (Markdown)</FormLabel>
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
                        No pitch introduction yet. Click Edit to add one.
                      </p>
                    )}
                  </div>
                ) : (
                  <FormControl>
                    <Textarea
                      placeholder="Enter the pitch introduction using Markdown formatting..."
                      {...field}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                )}
                <FormDescription>
                  A brief introduction that sets the stage for the pitch.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="generatedPitch"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Pitch (Markdown)</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPitchPreview(!showPitchPreview)}
                  >
                    {showPitchPreview ? (
                      <EyeOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    {showPitchPreview ? "Edit" : "Preview"}
                  </Button>
                </div>
                {showPitchPreview ? (
                  <div className="min-h-[300px] rounded-md border bg-muted/30 p-4">
                    {field.value ? (
                      <MarkdownContent content={field.value} />
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        No pitch content yet. Click Edit to add one.
                      </p>
                    )}
                  </div>
                ) : (
                  <FormControl>
                    <Textarea
                      placeholder="Enter the pitch using Markdown formatting..."
                      {...field}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                )}
                <FormDescription>
                  The main pitch content that sells the project to the client.
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
