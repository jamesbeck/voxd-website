"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteExample from "@/actions/saDeleteExample";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

export default function ExampleActions({
  exampleId,
  title,
}: {
  exampleId: string;
  title: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteExample = async () => {
    setIsDeleting(true);
    const response = await saDeleteExample({ exampleId });

    if (!response.success) {
      toast.error(
        `Error Deleting Example: ${
          response.error || "There was an error deleting the example"
        }`
      );
      setIsDeleting(false);
      return;
    }

    toast.success(`Successfully deleted "${title}"`);
    setIsDeleting(false);
    router.push("/admin/examples");
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <Alert
              destructive
              title={`Delete "${title}"`}
              description="This action cannot be undone. The example and all associated data will be permanently deleted."
              actionText="Delete"
              onAction={deleteExample}
            >
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
                Delete Example
              </DropdownMenuItem>
            </Alert>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
