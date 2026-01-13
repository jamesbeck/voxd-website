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
import { Eye, EyeOff } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import saUpdateOrganisationAbout from "@/actions/saUpdateOrganisationAbout";

const formSchema = z.object({
  about: z.string().optional(),
});

export default function AboutTab({
  organisationId,
  about,
}: {
  organisationId: string;
  about: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      about: about || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saUpdateOrganisationAbout({
      organisationId: organisationId,
      about: values.about || "",
    });

    if (!response.success) {
      setLoading(false);

      if (response.error) {
        toast.error("There was an error updating the about section");

        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
      return;
    }

    toast.success("About section updated successfully");
    router.refresh();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>About (Markdown)</FormLabel>
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
                <div className="min-h-[200px] rounded-md border bg-muted/30 p-4">
                  {field.value ? (
                    <MarkdownContent content={field.value} />
                  ) : (
                    <p className="text-muted-foreground text-sm italic">
                      No about content yet. Use &quot;Re-sync from Website&quot;
                      from the menu or click Edit to add content manually.
                    </p>
                  )}
                </div>
              ) : (
                <FormControl>
                  <Textarea
                    placeholder="Enter information about this organisation using Markdown formatting..."
                    {...field}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </FormControl>
              )}
              <FormDescription>
                A summary of the organisation including what they do, their
                location, and other relevant information. This can be
                auto-generated from their website.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
