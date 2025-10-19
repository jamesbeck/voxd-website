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
import generateExample from "@/lib/generateExample";
import { useState } from "react";

const formSchema = z.object({
  prompt: z.string(),
});

export default function GenereateExampleForm() {
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
    await generateExample({ prompt: values.prompt });
    console.log(values);
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
                  placeholder="Your Prompt"
                  {...field}
                  className="min-h-[400px]"
                />
              </FormControl>
              <FormDescription>Your prompt</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          Submit
        </Button>

        <div>
          <h2 className="text-xl font-bold">Tips</h2>
          <div>
            A good prompt should include:
            <ul className="list-disc ml-6">
              <li>
                The name of the business, or let the generater decide a generic
                one.
              </li>
              <li>
                A little about the business, it&apos;s location, and it&apos;s
                products/services.
              </li>
              <li>Key features of the bot</li>
              <li>
                Things it doesn&apos;t do, the AI will have a tendancy to add
                features/services that the bot won&apos;t be doint.
              </li>
            </ul>
          </div>
        </div>
      </form>
    </Form>
  );
}
