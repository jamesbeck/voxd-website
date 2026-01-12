"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetExampleTableData from "@/actions/saGetExampleTableData";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import generateExample from "@/lib/generateExample";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const VOXD_PARTNER_ID = "019a6ec7-43b1-7da4-a2d8-8c84acb387b4";

const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  partnerId: z.string().min(1, "Partner is required"),
});

const ExamplesTable = ({ superAdmin }: { superAdmin: boolean }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      partnerId: superAdmin ? VOXD_PARTNER_ID : "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const result = await generateExample({
        prompt: values.prompt,
        partnerId: values.partnerId,
      });
      if (result.success) {
        toast.success("Example generated successfully");
        setDialogOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to generate example");
      }
    } catch (error) {
      toast.error("An error occurred while generating the example");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Example
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Example</DialogTitle>
              <DialogDescription>
                Enter a prompt to generate a new example. Include details about
                the business, its services, and key features of the chatbot.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the business and chatbot features..."
                          {...field}
                          className="min-h-[200px]"
                          autoFocus
                        />
                      </FormControl>
                      <FormDescription>
                        Include: business name, location, products/services, key
                        bot features, and things it doesn&apos;t do.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Generate Example"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        getData={saGetExampleTableData}
        defaultSort={{
          name: "title",
          direction: "desc",
        }}
        columns={[
          ...(superAdmin
            ? [
                {
                  label: "Partner",
                  name: "partnerName",
                  sort: false,
                  format: (row: { partnerName?: string | null }) =>
                    row.partnerName || "—",
                },
              ]
            : []),
          {
            label: "Title",
            name: "title",
            sort: true,
          },
        ]}
        actions={(row: any) => {
          return (
            <div className="flex gap-2">
              <Button className="cursor-pointer" asChild>
                <Link href={`/admin/examples/${row.id}`}>View</Link>
              </Button>
              <Button className="cursor-pointer" asChild>
                <Link href={`/admin/examples/${row.id}/generate-chat`}>
                  Generate Chat
                </Link>
              </Button>
            </div>
          );
        }}
      />
    </div>
  );
};

export default ExamplesTable;
