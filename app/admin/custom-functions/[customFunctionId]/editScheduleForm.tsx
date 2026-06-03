"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import saUpdateCustomFunctionSchedule from "@/actions/saUpdateCustomFunctionSchedule";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  scheduleCron: z
    .string()
    .max(255, "Schedule cron must be 255 characters or fewer."),
});

export default function EditScheduleForm({
  customFunctionId,
  scheduleCron,
}: {
  customFunctionId: string;
  scheduleCron?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduleCron: scheduleCron || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const response = await saUpdateCustomFunctionSchedule({
      customFunctionId,
      scheduleCron: values.scheduleCron,
    });

    if (!response.success) {
      setLoading(false);
      form.setError("root", {
        type: "manual",
        message: response.error || "Failed to update schedule",
      });
      toast.error(response.error || "Failed to update schedule");
      return;
    }

    toast.success("Schedule updated");
    setLoading(false);
    router.refresh();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="scheduleCron"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Cron</FormLabel>
              <FormControl>
                <Input placeholder="0 * * * *" {...field} />
              </FormControl>
              <FormDescription>
                Leave blank to disable scheduling for this custom function.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          Save Schedule
        </Button>
      </form>
    </Form>
  );
}
