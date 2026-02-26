"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import saCloneDocument from "@/actions/saCloneDocument";
import saGetAgentTableData from "@/actions/saGetAgentTableData";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";

const formSchema = z.object({
  targetAgentId: z.string().min(1, "Please select a target agent"),
});

export default function CloneDocumentDialog({
  documentId,
  documentTitle,
  agentId,
  organisationId,
  open,
  onOpenChange,
}: {
  documentId: string;
  documentTitle: string;
  agentId: string;
  organisationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isCloning, setIsCloning] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetAgentId: "",
    },
  });

  // Wrapper around saGetAgentTableData that filters to the same organisation
  // and excludes the current agent
  const filteredAgentAction = useCallback(
    async (
      params: ServerActionReadParams,
    ): Promise<ServerActionReadResponse> => {
      const result = await saGetAgentTableData({
        ...params,
        organisationId,
      });

      if (result.success) {
        const filtered = result.data.filter(
          (agent: any) => agent.id !== agentId,
        );
        return {
          ...result,
          data: filtered,
          totalAvailable:
            result.totalAvailable - (result.data.length - filtered.length),
        };
      }

      return result;
    },
    [organisationId, agentId],
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsCloning(true);

    const response = await saCloneDocument({
      documentId,
      targetAgentId: values.targetAgentId,
    });

    if (!response.success) {
      setIsCloning(false);
      toast.error(response.error || "Failed to clone document");
      return;
    }

    toast.success("Document cloned successfully");
    onOpenChange(false);
    setIsCloning(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Clone Document to Another Agent</DialogTitle>
          <DialogDescription>
            Clone &ldquo;{documentTitle}&rdquo; and all its knowledge blocks to
            another agent in the same organisation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetAgentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Agent</FormLabel>
                  <FormControl>
                    <RemoteSelect
                      {...field}
                      serverAction={filteredAgentAction}
                      label={(record) => record.niceName || record.name}
                      valueField="id"
                      placeholder="Select an agent..."
                      emptyMessage="No other agents found in this organisation"
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
                disabled={isCloning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCloning}>
                {isCloning && <Spinner className="mr-2" />}
                {isCloning ? "Cloning..." : "Clone Document"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
