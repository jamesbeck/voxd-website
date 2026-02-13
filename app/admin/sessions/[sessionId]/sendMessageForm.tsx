"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import saSendMessage from "@/actions/saSendMessage";
import saPauseSession from "@/actions/saPauseSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  message: z.string().nonempty("Message is required"),
});

export default function NewQuoteForm({
  sessionId,
  lastMessageFromUserSecondsAgo,
  paused,
}: {
  sessionId: string;
  lastMessageFromUserSecondsAgo: number | null;
  paused: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [pauseAfterSend, setPauseAfterSend] = useState(true);
  const router = useRouter();

  //has it been longer than 24 hours since the last message from user
  const hasBeenLongerThan24Hours =
    lastMessageFromUserSecondsAgo !== null
      ? lastMessageFromUserSecondsAgo > 24 * 60 * 60
      : false;

  //how many seconds is it until 24 hours since last user message
  const secondsUntil24Hours =
    lastMessageFromUserSecondsAgo !== null
      ? 24 * 60 * 60 - lastMessageFromUserSecondsAgo
      : 0;

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const response = await saSendMessage({
      message: values.message,
      sessionId: sessionId,
    });

    if (!response.success) {
      // Handle error case
      setLoading(false);

      if (response.error) {
        toast.error("There was an error sending the message");

        if (response.error)
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
    }

    if (response.success) {
      if (pauseAfterSend && !paused) {
        const pauseResponse = await saPauseSession({ sessionId });
        if (!pauseResponse.success) {
          toast.error("Message sent but failed to pause session");
        } else {
          toast.success("Message sent and session paused");
        }
      } else {
        toast.success("Message sent successfully!");
      }
      router.refresh();
      form.reset();
    }

    setLoading(false);
  }

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
      </CardHeader>
      <CardContent>
        {hasBeenLongerThan24Hours ? (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-destructive">
                Cannot send message
              </h3>
              <div className="text-sm text-destructive">
                <p>
                  It has been more than 24 hours since the last message from the
                  user. WhatsApp does not allow free text messages outside of
                  this window.
                </p>
              </div>
            </div>
          </div>
        ) : (
          lastMessageFromUserSecondsAgo !== null && (
            <div className="mb-4 rounded-md bg-primary p-4">
              <p className="text-sm text-white">
                Time remaining to reply:{" "}
                <span className="font-semibold">
                  {formatTimeRemaining(secondsUntil24Hours)}
                </span>
              </p>
            </div>
          )
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="message"
              // rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder=""
                      {...field}
                      className="h-[300px]"
                      disabled={hasBeenLongerThan24Hours}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              {form.formState.errors.root && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={loading || hasBeenLongerThan24Hours}
              >
                {loading && <Spinner />}
                Submit
              </Button>
              {!paused && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pauseAfterSend"
                    checked={pauseAfterSend}
                    onCheckedChange={(checked) =>
                      setPauseAfterSend(checked === true)
                    }
                    disabled={loading || hasBeenLongerThan24Hours}
                  />
                  <Label
                    htmlFor="pauseAfterSend"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Pause session after sending
                  </Label>
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
