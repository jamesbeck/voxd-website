"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircleIcon } from "lucide-react";
import saUpdatePermissionDefinition from "@/actions/saUpdatePermissionDefinition";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const formSchema = z.object({
  permissionGroupId: z.string().min(1, "Group is required"),
  key: z.string().min(1, "Key is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  scopeMode: z.enum(["global", "agent"]),
  defaultValue: z.boolean(),
  requiresSuperAdminToManage: z.boolean(),
});

export default function EditPermissionDefinitionForm({
  permissionDefinitionId,
  permissionGroups,
  permissionGroupId,
  keyValue,
  name,
  description,
  scopeMode,
  defaultValue,
  requiresSuperAdminToManage,
}: {
  permissionDefinitionId: string;
  permissionGroups: { id: string; name: string }[];
  permissionGroupId: string;
  keyValue: string;
  name: string;
  description: string;
  scopeMode: "global" | "agent";
  defaultValue: boolean;
  requiresSuperAdminToManage: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      permissionGroupId,
      key: keyValue,
      name,
      description,
      scopeMode,
      defaultValue,
      requiresSuperAdminToManage,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const response = await saUpdatePermissionDefinition({
      permissionDefinitionId,
      ...values,
    });

    if (!response.success) {
      setLoading(false);
      if (response.error) {
        form.setError("root", { type: "manual", message: response.error });
      }
      toast.error(response.error || "Failed to update permission definition");
      return;
    }

    toast.success("Permission definition updated");
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
          name="permissionGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {permissionGroups.map((permissionGroup) => (
                    <SelectItem
                      key={permissionGroup.id}
                      value={permissionGroup.id}
                    >
                      {permissionGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopeMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope Mode</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scope mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Agent-scoped definitions use the existing precedence where
                global explicit overrides still win.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultValue"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-1">
                <FormLabel>Default Value</FormLabel>
                <FormDescription>
                  Whether this permission is granted when there is no explicit
                  override.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiresSuperAdminToManage"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-1">
                <FormLabel>Super Admin Managed</FormLabel>
                <FormDescription>
                  Only super admins can directly manage this permission
                  definition.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
