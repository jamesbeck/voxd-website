"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import saUpdateQuote from "@/actions/saUpdateQuote";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RemoteSelect } from "@/components/inputs/RemoteSelect";
import saGetAdminUserTableData from "@/actions/saGetAdminUserTableData";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  createdByAdminUserId: z.string().optional(),
});

export default function ChangeOwnerDialog({
  quoteId,
  createdByAdminUserId,
  open,
  onOpenChange,
}: {
  quoteId: string;
  createdByAdminUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      createdByAdminUserId: createdByAdminUserId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUpdating(true);

    const response = await saUpdateQuote({
      quoteId: quoteId,
      createdByAdminUserId: values.createdByAdminUserId || undefined,
    });

    if (!response.success) {
      setIsUpdating(false);
      toast.error(response.error || "There was an error updating the owner");

      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }

      if (response.fieldErrors) {
        for (const key in response.fieldErrors) {
          form.setError(key as keyof typeof values, {
            type: "manual",
            message: response.fieldErrors[key],
          });
        }
      }
      return;
    }

    toast.success(`Quote owner updated`);
    onOpenChange(false);
    setIsUpdating(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Owner</DialogTitle>
          <DialogDescription>
            Select a new owner for this quote.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="createdByAdminUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <RemoteSelect
                      {...field}
                      serverAction={saGetAdminUserTableData}
                      label={(record) =>
                        `${record.name}${
                          record.email ? ` (${record.email})` : ""
                        }`
                      }
                      valueField="id"
                      sortField="name"
                      placeholder="Select an owner..."
                      emptyMessage="No users found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Spinner className="mr-2" />}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
