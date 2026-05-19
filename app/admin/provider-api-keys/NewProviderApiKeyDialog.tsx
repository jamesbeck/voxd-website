"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewProviderApiKeyForm from "./newProviderApiKeyForm";

export default function NewProviderApiKeyDialog({
  preselectedOrganisationId,
  preselectedOrganisationName,
}: {
  preselectedOrganisationId?: string;
  preselectedOrganisationName?: string;
}) {
  const [open, setOpen] = useState(false);
  const isScopedToOrganisation = !!preselectedOrganisationId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New API Key</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>New API Key</DialogTitle>
          <DialogDescription>
            {isScopedToOrganisation
              ? "Create a new provider API key for this organisation."
              : "Create a new provider API key for an organisation."}
          </DialogDescription>
        </DialogHeader>
        <NewProviderApiKeyForm
          preselectedOrganisationId={preselectedOrganisationId}
          preselectedOrganisationName={preselectedOrganisationName}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
