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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontalIcon,
  Trash2Icon,
  ExternalLinkIcon,
  CopyIcon,
} from "lucide-react";
import Link from "next/link";

export default function ExampleActions({
  exampleId,
  title,
  slug,
}: {
  exampleId: string;
  title: string;
  slug: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const exampleUrl = `/examples/${slug}`;

  const copyToClipboard = async () => {
    const fullUrl = `${window.location.origin}${exampleUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

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
    <TooltipProvider>
      <div className="flex gap-2">
        <ButtonGroup>
          <Button variant="outline" size="sm" asChild>
            <Link href={exampleUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="h-4 w-4 mr-2" />
              View Example
            </Link>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                aria-label="Copy link to clipboard"
                className="h-8 w-8"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy link to clipboard</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
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
                  {isDeleting ? (
                    <Spinner />
                  ) : (
                    <Trash2Icon className="h-4 w-4" />
                  )}
                  Delete Example
                </DropdownMenuItem>
              </Alert>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
