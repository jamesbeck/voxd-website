"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetFeatureTableData from "@/actions/saGetFeatureTableData";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import saCreateFeature from "@/actions/saCreateFeature";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const FeaturesTable = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Generate slug from title
      const slug = values.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const result = await saCreateFeature({
        title: values.title,
        slug,
        icon: "Circle",
        short: "",
        body: "",
        topFeature: false,
      });
      if (result.success && result.data?.id) {
        toast.success("Feature created successfully");
        setDialogOpen(false);
        form.reset();
        router.push(`/admin/features/${result.data.id}`);
      } else if (!result.success) {
        toast.error(result.error || "Failed to create feature");
      } else {
        toast.error("Failed to create feature");
      }
    } catch (error) {
      toast.error("An error occurred while creating the feature");
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
              Create Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Feature</DialogTitle>
              <DialogDescription>
                Enter a title to create a new feature. You can add details after
                creation.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Feature title..."
                          {...field}
                          autoFocus
                        />
                      </FormControl>
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
                    {loading ? "Creating..." : "Create Feature"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        getData={saGetFeatureTableData}
        defaultSort={{
          name: "title",
          direction: "asc",
        }}
        columns={[
          {
            label: "Title",
            name: "title",
            sort: true,
            format: (row: { id: string; title: string }) => (
              <Link
                href={`/admin/features/${row.id}`}
                className="hover:underline"
              >
                {row.title}
              </Link>
            ),
          },
          {
            label: "Slug",
            name: "slug",
            sort: true,
          },
          {
            label: "Icon",
            name: "icon",
            sort: false,
          },
          {
            label: "Top Feature",
            name: "topFeature",
            sort: true,
            format: (row: { topFeature: boolean }) =>
              row.topFeature ? "✓" : "—",
          },
          {
            label: "Actions",
            name: "id",
            sort: false,
            format: (row: { id: string }) => (
              <Link href={`/admin/features/${row.id}`}>
                <Button size="sm">View</Button>
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
};

export default FeaturesTable;
