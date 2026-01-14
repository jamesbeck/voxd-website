"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saDeleteSupportTicket from "@/actions/saDeleteSupportTicket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

export default function TicketActions({
  ticketId,
  ticketNumber,
}: {
  ticketId: string;
  ticketNumber: number;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteTicket = async () => {
    setIsDeleting(true);
    const response = await saDeleteSupportTicket({ ticketId });

    if (!response.success) {
      toast.error(
        `Error Deleting Ticket: ${
          response.error || "There was an error deleting the ticket"
        }`
      );
      setIsDeleting(false);
      return;
    }

    toast.success(`Successfully deleted ticket #${ticketNumber}`);
    setIsDeleting(false);
    router.push("/admin/support-tickets");
  };

  return (
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
            title={`Delete Ticket #${ticketNumber}`}
            description="This action cannot be undone. The ticket and all associated comments will be permanently deleted."
            actionText="Delete"
            onAction={deleteTicket}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              {isDeleting ? <Spinner /> : <Trash2Icon className="h-4 w-4" />}
              Delete Ticket
            </DropdownMenuItem>
          </Alert>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
