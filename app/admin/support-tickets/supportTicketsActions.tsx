"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import CreateTicketDialog from "./CreateTicketDialog";
import RecordActions from "@/components/admin/RecordActions";

export default function SupportTicketsActions() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <RecordActions
        buttons={[
          {
            label: "New Ticket",
            icon: <Flag />,
            variant: "default",
            onClick: () => setCreateDialogOpen(true),
          },
        ]}
      />

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
