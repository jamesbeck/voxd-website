"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import CreateTicketDialog from "./CreateTicketDialog";

export default function SupportTicketsActions() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setCreateDialogOpen(true)}>
        <Flag className="h-4 w-4 mr-2" />
        New Ticket
      </Button>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
