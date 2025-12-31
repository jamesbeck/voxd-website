"use client";

import { AlertCircleIcon, CheckCircle2 } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saBulkCreateChunks } from "@/actions/saBulkCreateChunks";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  text: z
    .string()
    .nonempty("Text is required")
    .min(100, "Text must be at least 100 characters"),
  minLength: z.number().min(0),
  maxLength: z.number().min(100).max(2000),
  splitter: z.enum(["paragraph", "sentence"]),
  overlap: z.number().min(0).max(500),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkImportForm({
  documentId,
  agentId,
}: {
  documentId: string;
  agentId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ chunksCreated: number } | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      minLength: 100,
      maxLength: 1500,
      splitter: "sentence",
      overlap: 50,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setResult(null);

    const response = await saBulkCreateChunks({
      documentId,
      text: values.text,
      chunkOptions: {
        minLength: values.minLength,
        maxLength: values.maxLength,
        splitter: values.splitter,
        overlap: values.overlap,
      },
    });

    if (!response.success) {
      setLoading(false);

      toast.error("There was an error creating the chunks");

      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
    }

    if (response.success) {
      setResult(response.data);
      toast.success(`${response.data.chunksCreated} chunks created`);
      form.reset();
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="text"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Text Content</FormLabel>
                <span className="text-sm text-muted-foreground">
                  {field.value.length.toLocaleString()} characters
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Paste your text content here. It will be automatically split into chunks..."
                  className="min-h-[300px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Paste a large amount of text and it will be automatically split
                into chunks using the settings below.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="splitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Split Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sentence">Sentence (recommended)</SelectItem>
                    <SelectItem value="paragraph">Paragraph (newlines only)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Length</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Length</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={100}
                    max={2000}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="overlap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overlap</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={500}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Created {result.chunksCreated} chunks with embeddings.{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() =>
                  router.push(
                    `/admin/agents/${agentId}/documents/${documentId}?tab=chunks`
                  )
                }
              >
                View chunks
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner />}
            Split & Create Chunks
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
