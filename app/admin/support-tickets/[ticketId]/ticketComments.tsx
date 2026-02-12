"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Send, User } from "lucide-react";
import saGetSupportTicketComments from "@/actions/saGetSupportTicketComments";
import saAddSupportTicketComment from "@/actions/saAddSupportTicketComment";
import MentionTextarea, {
  renderCommentWithMentions,
} from "@/components/inputs/MentionTextarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Comment = {
  id: string;
  comment: string;
  createdAt: Date;
  adminUserId: string;
  adminUserName: string | null;
  adminUserEmail: string | null;
};

const formSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
});

export default function TicketComments({
  ticketId,
  ticketStatus,
}: {
  ticketId: string;
  ticketStatus: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reopenTicket, setReopenTicket] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comment: "",
    },
  });

  const fetchComments = async () => {
    const result = await saGetSupportTicketComments({ ticketId });
    if (result.success) {
      setComments(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

    // Listen for status change events to refresh comments
    const handleStatusChange = () => {
      fetchComments();
    };

    window.addEventListener("ticket-status-changed", handleStatusChange);

    return () => {
      window.removeEventListener("ticket-status-changed", handleStatusChange);
    };
  }, [ticketId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);

    const result = await saAddSupportTicketComment({
      ticketId,
      comment: values.comment,
      reopenTicket,
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error || "Failed to add comment");
      return;
    }

    toast.success("Comment added");
    form.reset();
    setReopenTicket(false);
    fetchComments();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No comments yet. Be the first to add one!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.adminUserName ||
                      comment.adminUserEmail ||
                      "Unknown User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                    {" · "}
                    {formatDistance(new Date(comment.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm whitespace-pre-wrap">
                    {renderCommentWithMentions(comment.comment)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <div className="border-t pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MentionTextarea
                      ticketId={ticketId}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add a comment... Use @ to mention users"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end items-center gap-4">
              {ticketStatus?.toLowerCase() === "closed" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="reopenTicket"
                          checked={reopenTicket}
                          onCheckedChange={(checked) =>
                            setReopenTicket(checked === true)
                          }
                        />
                        <Label
                          htmlFor="reopenTicket"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Re-open ticket
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[280px]">
                      <p>
                        Check this box to reopen the ticket when submitting your
                        comment. Only reopen if you believe the work isn't
                        complete.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
