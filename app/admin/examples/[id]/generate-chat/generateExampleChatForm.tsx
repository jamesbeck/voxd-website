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
import generateExampleChat from "@/lib/generateExampleChat";
import { useState } from "react";

const formSchema = z.object({
  prompt: z.string(),
});

export default function GenereateExampleForm({
  exampleId,
}: {
  exampleId: string;
}) {
  const [loading, setLoading] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const response = await generateExampleChat({
      prompt: values.prompt,
      exampleId: exampleId,
    });

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="shadcn"
                  {...field}
                  className="min-h-[400px]"
                />
              </FormControl>
              <FormDescription>
                Add any detail specifics for the chat you want generated.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
