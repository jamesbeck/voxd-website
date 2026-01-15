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
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  prompt: z.string(),
  partnerId: z.string().optional(),
});

export default function GenerateExampleForm({
  superAdmin,
}: {
  superAdmin: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      partnerId: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const result = await generateExample({
      prompt: values.prompt,
      partnerId: values.partnerId,
    });
    if (result.success && result.data?.id) {
      router.push(`/admin/examples/${result.data.id}`);
    }
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {superAdmin && (
          <FormField
            control={form.control}
            name="partnerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partner (Optional)</FormLabel>
                <FormControl>
                  <RemoteSelect
                    {...field}
                    serverAction={saGetPartnerTableData}
                    label={(record) => `${record.name}`}
                    valueField="id"
                    sortField="name"
                    placeholder="Select a partner..."
                    emptyMessage="No partners found"
                  />
                </FormControl>
                <FormDescription>
                  Assign this example to a partner. Leave empty for a public
                  example.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
