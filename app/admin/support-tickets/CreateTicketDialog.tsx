"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import saCreateSupportTicket from "@/actions/saCreateSupportTicket";
import TicketCreatedDialog from "@/components/admin/TicketCreatedDialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(10, "Please provide a description (at least 10 characters)"),
});

type CreatedTicket = {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  createdAt: Date;
};

type CreateTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateTicketDialog({
  open,
  onOpenChange,
}: CreateTicketDialogProps) {
  const [loading, setLoading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(
    null
  );
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const result = await saCreateSupportTicket({
      title: values.title,
      description: values.description,
    });

    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Failed to create support ticket");
      return;
    }

    // Show success state
    setCreatedTicket(result.data as CreatedTicket);
    form.reset();
  };

  const handleSuccessClose = () => {
    setCreatedTicket(null);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <Dialog open={open && !createdTicket} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Create a support ticket for tracking issues or tasks that aren't
              tied to a specific session or message.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief summary of the issue"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner /> : "Create Ticket"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <TicketCreatedDialog
        open={!!createdTicket}
        onOpenChange={handleSuccessClose}
        ticket={createdTicket}
      />
    </>
  );
}
