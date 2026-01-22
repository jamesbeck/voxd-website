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
import { Switch } from "@/components/ui/switch";
import saUpdateQuotePitch from "@/actions/saUpdateQuotePitch";
import saGenerateQuotePitch from "@/actions/saGenerateQuotePitch";
import { Sparkles, AlertCircle } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SimpleMarkdownEditor } from "@/components/SimpleMarkdownEditor";
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
  generatedPitchIntroduction: z.string().optional(),
  generatedPitch: z.string().optional(),
  pitchHideSections: z.array(z.string()).optional(),
});

const personalMessageSchema = z.object({
  pitchPersonalMessage: z.string().optional(),
});

export default function EditPitchForm({
  quoteId,
  pitchPersonalMessage,
  generatedPitchIntroduction,
  generatedPitch,
  pitchHideSections,
}: {
  quoteId: string;
  pitchPersonalMessage: string | null;
  generatedPitchIntroduction: string | null;
  generatedPitch: string | null;
  pitchHideSections: string[] | null;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingPersonalMessage, setLoadingPersonalMessage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [savingSections, setSavingSections] = useState(false);
  const router = useRouter();

  const personalMessageForm = useForm<z.infer<typeof personalMessageSchema>>({
    resolver: zodResolver(personalMessageSchema),
    defaultValues: {
      pitchPersonalMessage: pitchPersonalMessage || "",
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generatedPitchIntroduction: generatedPitchIntroduction || "",
      generatedPitch: generatedPitch || "",
      pitchHideSections: pitchHideSections || [],
    },
  });

  async function savePitchHideSections(hideSections: string[]) {
    setSavingSections(true);

    const response = await saUpdateQuotePitch({
      quoteId: quoteId,
      pitchHideSections: hideSections,
    });

    if (!response.success) {
      toast.error("Failed to update section visibility");
    } else {
      toast.success("Section visibility updated");
      router.refresh();
    }

    setSavingSections(false);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateQuotePitch({
      quoteId: quoteId,
      generatedPitchIntroduction: values.generatedPitchIntroduction,
      generatedPitch: values.generatedPitch,
      pitchHideSections: values.pitchHideSections,
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

  async function onSubmitPersonalMessage(
    values: z.infer<typeof personalMessageSchema>,
  ) {
    setLoadingPersonalMessage(true);

    const response = await saUpdateQuotePitch({
      quoteId: quoteId,
      pitchPersonalMessage: values.pitchPersonalMessage,
    });

    if (!response.success) {
      setLoadingPersonalMessage(false);

      if (response.error) {
        toast.error("There was an error updating the personal message");

        personalMessageForm.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
    }

    if (response.success) {
      toast.success("Personal message updated successfully");
      router.refresh();
    }

    setLoadingPersonalMessage(false);
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
      response.data.generatedPitchIntroduction || "",
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

      {/* Personal Message Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Personal Message</h3>
          <p className="text-sm text-muted-foreground">
            Add an optional personal message at the top of the pitch
          </p>
        </div>

        <Form {...personalMessageForm}>
          <form
            onSubmit={personalMessageForm.handleSubmit(onSubmitPersonalMessage)}
            className="space-y-4"
          >
            <FormField
              control={personalMessageForm.control}
              name="pitchPersonalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a personal message to include at the top of the pitch..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {personalMessageForm.formState.errors.root && (
              <div className="max-w-xl">
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {personalMessageForm.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Button type="submit" disabled={loadingPersonalMessage}>
              {loadingPersonalMessage && <Spinner className="mr-2" />}
              Save Personal Message
            </Button>
          </form>
        </Form>
      </div>

      <hr className="my-8" />

      {/* Section Visibility Section */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Section Visibility</h3>

        <Form {...form}>
          <FormField
            control={form.control}
            name="pitchHideSections"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: "how-it-works", label: "How It Works" },
                    { id: "portal", label: "Portal" },
                    { id: "service", label: "Service" },
                    { id: "pricing", label: "Pricing" },
                    { id: "next-steps", label: "Next Steps" },
                  ].map((section) => (
                    <FormField
                      key={section.id}
                      control={form.control}
                      name="pitchHideSections"
                      render={({ field }) => {
                        const isHidden = field.value?.includes(section.id);
                        return (
                          <FormItem className="flex flex-row items-center gap-2 rounded border px-3 py-2">
                            <FormControl>
                              <Switch
                                checked={!isHidden}
                                disabled={savingSections}
                                onCheckedChange={(checked) => {
                                  const currentHidden = field.value || [];
                                  let newHidden: string[];
                                  if (checked) {
                                    newHidden = currentHidden.filter(
                                      (id) => id !== section.id,
                                    );
                                  } else {
                                    newHidden = [...currentHidden, section.id];
                                  }
                                  field.onChange(newHidden);
                                  savePitchHideSections(newHidden);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">
                              {section.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>

      <hr className="my-8" />

      {/* Pitch Content Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Pitch Content</h3>
          <p className="text-sm text-muted-foreground">
            Manage the introduction and main pitch content
          </p>
        </div>

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
            Generate Pitch
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="generatedPitchIntroduction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pitch Introduction</FormLabel>
                  <FormControl>
                    <SimpleMarkdownEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Enter the pitch introduction..."
                    />
                  </FormControl>
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
                  <FormLabel>Pitch</FormLabel>
                  <FormControl>
                    <SimpleMarkdownEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Enter the pitch content..."
                    />
                  </FormControl>
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
              Save Pitch Content
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
