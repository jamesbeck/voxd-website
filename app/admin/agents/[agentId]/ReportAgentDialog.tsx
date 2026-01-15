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
  createdAt: string;
};

type ReportAgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
};

export default function ReportAgentDialog({
  open,
  onOpenChange,
  agentId,
}: ReportAgentDialogProps) {
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
      agentId,
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
            <DialogTitle>Report Issue for this Agent</DialogTitle>
            <DialogDescription>
              Create a support ticket for this agent. This will be visible to
              all team members.
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

      <Dialog open={!!createdTicket} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Ticket Created
            </DialogTitle>
            <DialogDescription>
              Your support ticket has been successfully created.
            </DialogDescription>
          </DialogHeader>
          {createdTicket && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Ticket #{createdTicket.ticketNumber}
                    </p>
                    <p className="font-medium">{createdTicket.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {createdTicket.status}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(createdTicket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  onClick={handleSuccessClose}
                >
                  <Link
                    href={`/admin/support-tickets/${createdTicket.id}`}
                    className="flex items-center gap-2"
                  >
                    View Ticket
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button className="flex-1" onClick={handleSuccessClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
