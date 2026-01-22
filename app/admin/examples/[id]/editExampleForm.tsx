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
import saUpdateExample from "@/actions/saUpdateExample";
import { useRouter } from "next/navigation";
import { FormMultiSelect } from "@/components/inputs/MultiSelect";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SimpleMarkdownEditor } from "@/components/SimpleMarkdownEditor";

const VOXD_PARTNER_ID = "019a6ec7-43b1-7da4-a2d8-8c84acb387b4";

const formSchema = z.object({
  title: z.string(),
  industries: z.array(z.string()),
  functions: z.array(z.string()),
  short: z.string(),
  body: z.string(),
  partnerId: z.string().min(1, "Partner is required"),
});

export default function EditExampleForm({
  id,
  title,
  short,
  body,
  industries,
  industriesOptions,
  functions,
  functionsOptions,
  partnerId,
  superAdmin,
}: {
  id: string;
  title: string;
  short: string;
  body: string;
  industries: string[];
  industriesOptions: { label: string; value: string }[];
  functions: string[];
  functionsOptions: { label: string; value: string }[];
  partnerId?: string;
  superAdmin: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: title,
      industries: industries,
      functions: functions,
      short: short,
      body: body,
      partnerId: partnerId || VOXD_PARTNER_ID,
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    await saUpdateExample({
      id,
      title: values.title,
      short: values.short,
      body: values.body,
      industries: values.industries,
      functions: values.functions,
      partnerId: values.partnerId,
    });

    setLoading(false);
    router.refresh();
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
                <FormLabel>Partner</FormLabel>
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
                  Assign this example to a partner.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title" {...field} />
              </FormControl>
              <FormDescription>The title of the example.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industries</FormLabel>
              <FormControl>
                <FormMultiSelect
                  options={industriesOptions}
                  placeholder="Select industries…"
                  {...field}
                />
              </FormControl>
              <FormDescription>Which industries are related.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="functions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Functions</FormLabel>
              <FormControl>
                <FormMultiSelect
                  options={functionsOptions}
                  placeholder="Select functions…"
                  {...field}
                />
              </FormControl>
              <FormDescription>Which industries are related.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="short"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Short"
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                A short version of the example for the card.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  placeholder="Enter the body content..."
                />
              </FormControl>
              <FormDescription>The body of the example.</FormDescription>
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
