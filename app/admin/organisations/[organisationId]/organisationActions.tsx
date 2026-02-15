"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteOrganisation from "@/actions/saDeleteOrganisation";
import { saUpdateOrganisation } from "@/actions/saUpdateOrganisation";
import { saSyncOrganisationFromWebsite } from "@/actions/saSyncOrganisationFromWebsite";
import MoveToPartnerDialog from "./MoveToPartnerDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import {
  ArrowRightLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  webAddress: z.string().optional(),
});

export default function OrganisationActions({
  organisationId,
  name,
  webAddress,
  isSuperAdmin = false,
  currentPartnerId = null,
}: {
  organisationId: string;
  name: string;
  webAddress?: string;
  isSuperAdmin?: boolean;
  currentPartnerId?: string | null;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [moveToPartnerDialogOpen, setMoveToPartnerDialogOpen] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: name || "",
      webAddress: webAddress || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUpdating(true);

    const response = await saUpdateOrganisation({
      organisationId: organisationId,
      name: values.name,
      webAddress: values.webAddress,
    });

    if (!response.success) {
      setIsUpdating(false);
      toast.error(
        response.error || "There was an error updating the organisation",
      );

      if (response.error) {
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
      return;
    }

    toast.success(`Organisation ${values.name} updated`);
    setEditDialogOpen(false);
    setIsUpdating(false);
    router.refresh();
  }

  const deleteOrganisation = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteOrganisation({ organisationId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Organisation: ${
          saResponse.error || "There was an error deleting the organisation"
        }`,
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    setIsDeleting(false);
    router.push("/admin/organisations");
  };

  const syncFromWebsite = async () => {
    if (!webAddress) {
      toast.error("No web address configured for this organisation");
      return;
    }

    setSyncError(null);
    setSyncDialogOpen(true);
    setIsSyncing(true);
    const response = await saSyncOrganisationFromWebsite({ organisationId });

    if (!response.success) {
      setSyncError(
        response.error || "There was an error syncing from the website",
      );
      setIsSyncing(false);
      return;
    }

    toast.success("Organisation info synced from website");
    setIsSyncing(false);
    setSyncDialogOpen(false);
    router.refresh();
  };

  return (
    <>
      <ButtonGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="More Options"
              className="h-8 w-8"
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                <PencilIcon className="h-4 w-4" />
                Edit Organisation
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={syncFromWebsite}
                disabled={isSyncing || !webAddress}
              >
                {isSyncing ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                Re-sync from Website
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem
                  onSelect={() => setMoveToPartnerDialogOpen(true)}
                >
                  <ArrowRightLeftIcon className="h-4 w-4" />
                  Move to Partner
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <Alert
                destructive
                title={`Delete ${name}`}
                description="This action cannot be undone. All agents, users, and data associated with this organisation will be permanently deleted."
                actionText="Delete"
                onAction={deleteOrganisation}
              >
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  {isDeleting ? (
                    <Spinner />
                  ) : (
                    <Trash2Icon className="h-4 w-4" />
                  )}
                  Delete Organisation
                </DropdownMenuItem>
              </Alert>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Organisation</DialogTitle>
            <DialogDescription>
              Update the organisation details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Joe Bloggs Ltd" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="webAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Web Address</FormLabel>
                    <FormControl>
                      <Input placeholder="www.example.com" {...field} />
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
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Spinner className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={syncDialogOpen}
        onOpenChange={(open) => !isSyncing && setSyncDialogOpen(open)}
      >
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isSyncing
                ? "Analysing Website"
                : syncError
                  ? "Sync Failed"
                  : "Sync Complete"}
            </DialogTitle>
            <DialogDescription>
              {isSyncing
                ? "Analysing the organisation's website to gather information..."
                : syncError
                  ? syncError
                  : "Website analysis complete."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            {isSyncing ? (
              <Spinner className="h-8 w-8" />
            ) : syncError ? (
              <div className="flex justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => setSyncDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <MoveToPartnerDialog
        organisationId={organisationId}
        currentPartnerId={currentPartnerId}
        open={moveToPartnerDialogOpen}
        onOpenChange={setMoveToPartnerDialogOpen}
      />
    </>
  );
}
