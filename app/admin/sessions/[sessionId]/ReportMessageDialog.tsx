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
import { CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import saCreateSupportTicket from "@/actions/saCreateSupportTicket";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(10, "Please provide a description (at least 10 characters)"),
});

type ReportMessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  messageId: string;
  messageType: "user" | "assistant";
};

type CreatedTicket = {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  createdAt: string;
};

export default function ReportMessageDialog({
  open,
  onOpenChange,
  agentId,
  messageId,
  messageType,
}: ReportMessageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setTimeout(() => {
        form.reset();
        setCreatedTicket(null);
      }, 200);
    }
    onOpenChange(isOpen);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saCreateSupportTicket({
      agentId,
      title: values.title,
      description: values.description,
      messageId,
      messageType,
    });

    setLoading(false);

    if (!response.success) {
      toast.error(response.error || "Failed to create support ticket");
      return;
    }

    setCreatedTicket(response.data);
  }

  // Show success state
  if (createdTicket) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Ticket Created
            </DialogTitle>
            <DialogDescription>
              Your support ticket has been created successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">
                  Ticket Number
                </span>
                <span className="font-mono font-semibold">
                  #{createdTicket.ticketNumber}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Title</span>
                <p className="text-sm font-medium">{createdTicket.title}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Close
              </Button>
              <Button asChild>
                <Link href={`/admin/support-tickets/${createdTicket.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Ticket
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show form state
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Create a support ticket for this message. Describe the issue
            you&apos;ve encountered.
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
                      placeholder="Brief summary of the issue..."
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
                      placeholder="Describe the issue in more detail..."
                      className="min-h-[100px] resize-none"
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
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
