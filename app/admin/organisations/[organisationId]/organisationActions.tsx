"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteOrganisation from "@/actions/saDeleteOrganisation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

export default function OrganisationActions({
  organisationId,
  name,
}: {
  organisationId: string;
  name: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteOrganisation = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteOrganisation({ organisationId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Organisation: ${
          saResponse.error || "There was an error deleting the organisation"
        }`
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    setIsDeleting(false);
    router.push("/admin/organisations");
  };

  return (
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
                {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
                Delete Organisation
              </DropdownMenuItem>
            </Alert>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
