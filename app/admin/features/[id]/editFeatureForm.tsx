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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import saUpdateFeature from "@/actions/saUpdateFeature";
import saGenerateFeatureBody from "@/actions/saGenerateFeatureBody";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SimpleMarkdownEditor } from "@/components/SimpleMarkdownEditor";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  icon: z.string(),
  short: z.string(),
  body: z.string(),
  topFeature: z.boolean(),
});

export default function EditFeatureForm({
  id,
  title,
  slug,
  icon,
  short,
  body,
  topFeature,
}: {
  id: string;
  title: string;
  slug: string;
  icon: string;
  short: string;
  body: string;
  topFeature: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title,
      icon,
      short,
      body,
      topFeature,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Generate slug from title
    const slug = values.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const result = await saUpdateFeature({
      id,
      ...values,
      slug,
    });

    setLoading(false);

    if (result.success) {
      router.refresh();
    }
  }

  async function handleGenerateBody() {
    const currentTitle = form.getValues("title");
    const currentShort = form.getValues("short");

    if (!currentTitle) {
      toast.error("Please enter a title first");
      return;
    }

    setGenerating(true);
    try {
      const result = await saGenerateFeatureBody({
        featureId: id,
        title: currentTitle,
        short: currentShort,
      });

      if (result.success && result.data?.body) {
        form.setValue("body", result.data.body);
        toast.success("Feature content generated successfully");
        router.refresh();
      } else if (!result.success) {
        toast.error(result.error || "Failed to generate content");
      }
    } catch (error) {
      toast.error("An error occurred while generating content");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Lucide icon name (e.g., Brain, MessageSquare, Zap)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="short"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[100px]" />
              </FormControl>
              <FormDescription>
                A brief summary of the feature for cards and listings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="topFeature"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Top Feature</FormLabel>
                <FormDescription>
                  Mark this as a featured/highlighted feature
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Feature Content</h3>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateBody}
              disabled={generating || !form.getValues("title")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : "Generate Content"}
            </Button>
          </div>

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Body</FormLabel>
                <FormControl>
                  <SimpleMarkdownEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Enter the feature body content..."
                  />
                </FormControl>
                <FormDescription>The body of the feature.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
