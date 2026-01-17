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

type ReportSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  sessionId: string;
};

export default function ReportSessionDialog({
  open,
  onOpenChange,
  agentId,
  sessionId,
}: ReportSessionDialogProps) {
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

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // If we're closing after creating a ticket, refresh the page
      const hadTicket = !!createdTicket;
      form.reset();
      setCreatedTicket(null);
      if (hadTicket) {
        router.refresh();
      }
    }
    onOpenChange(isOpen);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateSupportTicket({
      agentId,
      title: values.title,
      description: values.description,
      sessionId,
    });

    setLoading(false);

    if (!response.success) {
      toast.error(response.error || "Failed to create support ticket");
      return;
    }

    setCreatedTicket(response.data);
  }

  return (
    <>
      <TicketCreatedDialog
        open={!!createdTicket}
        onOpenChange={handleClose}
        ticket={createdTicket}
      />

      <Dialog open={open && !createdTicket} onOpenChange={handleClose}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Session</DialogTitle>
            <DialogDescription>
              Create a support ticket for this entire session. Provide a title
              and description of the issue.
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
                        placeholder="Brief description of the issue..."
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
                        placeholder="Provide more details about the issue with this session..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Spinner className="mr-2" />}
                  Create Ticket
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
