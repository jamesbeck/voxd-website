"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saSubmitQuoteForCostPricing from "@/actions/saSubmitQuoteForCostPricing";
import saDeleteQuote from "@/actions/saDeleteQuote";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  UserCog,
  ExternalLink,
  Copy,
} from "lucide-react";
import ChangeOwnerDialog from "./ChangeOwnerDialog";

export default function QuoteActions({
  quoteId,
  name,
  status,
  canDelete,
  createdByAdminUserId,
}: {
  quoteId: string;
  name: string;
  status: string;
  canDelete: boolean;
  createdByAdminUserId: string | null;
}) {
  const [isSubmittingForPricing, setIsSubmittingForPricing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);

  const router = useRouter();

  const canSubmitForPricing = status === "Draft";

  const submitForPricing = async () => {
    setIsSubmittingForPricing(true);
    const saResponse = await saSubmitQuoteForCostPricing({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Submitting for Pricing: ${
          saResponse.error || "There was an error submitting for pricing"
        }`
      );
      setIsSubmittingForPricing(false);
      return;
    }
    // If successful
    toast.success(`Successfully submitted ${name} for pricing`);
    setIsSubmittingForPricing(false);
    router.refresh();
  };

  const deleteQuote = async () => {
    setIsDeleting(true);
    const saResponse = await saDeleteQuote({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Deleting Quote: ${
          saResponse.error || "There was an error deleting the quote"
        }`
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    router.push("/admin/quotes");
  };

  return (
    <div className="flex items-center gap-2">
      {canSubmitForPricing && (
        <Alert
          title={`Submit ${name} for Pricing`}
          description="Are you sure you want to submit this quote for cost pricing from Voxd?"
          actionText="Submit for Pricing"
          onAction={submitForPricing}
          destructive={false}
        >
          <Button className="cursor-pointer" size="sm">
            {isSubmittingForPricing ? <Spinner /> : null}
            Submit to Voxd
          </Button>
        </Alert>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild className="cursor-pointer">
            <a
              href={`/pitches/${quoteId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Pitch
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/pitches/${quoteId}`
              );
              toast.success("Pitch link copied to clipboard");
            }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Pitch Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <a
              href={`/proposals/${quoteId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Proposal
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/proposals/${quoteId}`
              );
              toast.success("Proposal link copied to clipboard");
            }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Proposal Link
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setChangeOwnerOpen(true)}
                className="cursor-pointer"
              >
                <UserCog className="h-4 w-4 mr-2" />
                Change Owner
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Alert
                title={`Delete ${name}`}
                description="Are you sure you want to delete this quote? This action cannot be undone."
                actionText="Delete Quote"
                onAction={deleteQuote}
                destructive={true}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer text-destructive"
                >
                  {isDeleting ? (
                    <Spinner />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  )}
                  Delete Quote
                </DropdownMenuItem>
              </Alert>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeOwnerDialog
        quoteId={quoteId}
        createdByAdminUserId={createdByAdminUserId}
        open={changeOwnerOpen}
        onOpenChange={setChangeOwnerOpen}
      />
    </div>
  );
}
