"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import saMoveOrganisationToPartner from "@/actions/saMoveOrganisationToPartner";
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
import saGetPartnerTableData from "@/actions/saGetPartnerTableData";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  partnerId: z.string().min(1, "Please select a partner"),
});

export default function MoveToPartnerDialog({
  organisationId,
  currentPartnerId,
  open,
  onOpenChange,
}: {
  organisationId: string;
  currentPartnerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partnerId: currentPartnerId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUpdating(true);

    const response = await saMoveOrganisationToPartner({
      organisationId,
      partnerId: values.partnerId,
    });

    if (!response.success) {
      setIsUpdating(false);
      toast.error(
        response.error || "There was an error moving the organisation",
      );

      if (response.error) {
        form.setError("root", {
          type: "manual",
          message: response.error,
        });
      }
      return;
    }

    toast.success("Organisation moved to new partner");
    onOpenChange(false);
    setIsUpdating(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move to Partner</DialogTitle>
          <DialogDescription>
            Select a new partner for this organisation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      label={(record) => record.name}
                      valueField="id"
                      sortField="name"
                      placeholder="Select a partner..."
                      emptyMessage="No partners found"
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
                Move
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
