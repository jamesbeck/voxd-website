"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saSubmitQuoteForCostPricing from "@/actions/saSubmitQuoteForCostPricing";
import saMarkQuoteConceptSentToClient from "@/actions/saMarkQuoteConceptSentToClient";
import saDeleteQuote from "@/actions/saDeleteQuote";
import saReopenQuote from "@/actions/saReopenQuote";
import saReturnQuoteToDraft from "@/actions/saReturnQuoteToDraft";
import saReturnQuoteToConceptSent from "@/actions/saReturnQuoteToConceptSent";
import saReturnQuoteToCostPricingReceived from "@/actions/saReturnQuoteToCostPricingReceived";
import saMarkQuoteSentToClient from "@/actions/saMarkQuoteSentToClient";
import saCloseQuote from "@/actions/saCloseQuote";
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
  CopyPlus,
  RotateCcw,
  RotateCw,
  Undo2,
  XCircle,
} from "lucide-react";
import ChangeOwnerDialog from "./ChangeOwnerDialog";
import CloneQuoteDialog from "./CloneQuoteDialog";

export default function QuoteActions({
  quoteId,
  shortLinkId,
  name,
  organisationName,
  status,
  canDelete,
  createdByAdminUserId,
  isSuperAdmin = false,
}: {
  quoteId: string;
  shortLinkId: string;
  name: string;
  organisationName: string;
  status: string;
  canDelete: boolean;
  createdByAdminUserId: string | null;
  isSuperAdmin?: boolean;
}) {
  const [isSubmittingForPricing, setIsSubmittingForPricing] = useState(false);
  const [isSendingConcept, setIsSendingConcept] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReturningToDraft, setIsReturningToDraft] = useState(false);
  const [isReturningToConceptSent, setIsReturningToConceptSent] =
    useState(false);
  const [isReturningToCostPricing, setIsReturningToCostPricing] =
    useState(false);
  const [isMarkingSentToClient, setIsMarkingSentToClient] = useState(false);
  const [isClosingWon, setIsClosingWon] = useState(false);
  const [isClosingLost, setIsClosingLost] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);

  const router = useRouter();

  // SuperAdmins can also "Mark as Proposal with Client" from Draft or Concept Sent to Client status
  const canSendConceptToClient = status === "Draft";
  const canSubmitForPricing =
    status === "Draft" || status === "Concept Sent to Client";
  const canReturnToDraft =
    status !== "Draft" && status !== "Closed Won" && status !== "Closed Lost";
  const canReturnToConceptSent =
    status === "Sent to Voxd for Cost Pricing" ||
    status === "Cost Pricing Received from Voxd";
  const canMarkSentToClient =
    status === "Cost Pricing Received from Voxd" ||
    ((status === "Draft" || status === "Concept Sent to Client") &&
      isSuperAdmin);
  const canClose = status === "Proposal with Client";
  const canReturnToCostPricing = status === "Proposal with Client";
  const canReopen = status === "Closed Won" || status === "Closed Lost";

  const sendConceptToClient = async () => {
    setIsSendingConcept(true);
    const saResponse = await saMarkQuoteConceptSentToClient({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Sending Concept: ${
          saResponse.error || "There was an error sending the concept"
        }`,
      );
      setIsSendingConcept(false);
      return;
    }
    // If successful
    toast.success(`Successfully sent ${name} concept to client`);
    setIsSendingConcept(false);
    router.refresh();
  };

  const submitForPricing = async () => {
    setIsSubmittingForPricing(true);
    const saResponse = await saSubmitQuoteForCostPricing({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Submitting for Pricing: ${
          saResponse.error || "There was an error submitting for pricing"
        }`,
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
        }`,
      );
      setIsDeleting(false);
      return;
    }
    // If successful
    toast.success(`Successfully deleted ${name}`);
    router.push("/admin/quotes");
  };

  const returnToDraft = async () => {
    setIsReturningToDraft(true);
    const saResponse = await saReturnQuoteToDraft({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Returning to Draft: ${
          saResponse.error || "There was an error returning to draft"
        }`,
      );
      setIsReturningToDraft(false);
      return;
    }
    // If successful
    toast.success(`Successfully returned ${name} to draft status`);
    setIsReturningToDraft(false);
    router.refresh();
  };

  const returnToConceptSent = async () => {
    setIsReturningToConceptSent(true);
    const saResponse = await saReturnQuoteToConceptSent({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Returning to Concept Sent: ${
          saResponse.error ||
          "There was an error returning to concept sent status"
        }`,
      );
      setIsReturningToConceptSent(false);
      return;
    }
    // If successful
    toast.success(`Successfully returned ${name} to concept sent status`);
    setIsReturningToConceptSent(false);
    router.refresh();
  };

  const markSentToClient = async () => {
    setIsMarkingSentToClient(true);
    const saResponse = await saMarkQuoteSentToClient({
      quoteId,
      skipFromDraft: status === "Draft" || status === "Concept Sent to Client",
    });

    if (!saResponse.success) {
      toast.error(
        `Error Marking as Proposal with Client: ${
          saResponse.error ||
          "There was an error marking as proposal with client"
        }`,
      );
      setIsMarkingSentToClient(false);
      return;
    }
    // If successful
    toast.success(`Successfully marked ${name} as proposal with client`);
    setIsMarkingSentToClient(false);
    router.refresh();
  };

  const closeQuoteWon = async () => {
    setIsClosingWon(true);
    const saResponse = await saCloseQuote({ quoteId, outcome: "won" });

    if (!saResponse.success) {
      toast.error(
        `Error Closing Quote: ${
          saResponse.error || "There was an error closing the quote"
        }`,
      );
      setIsClosingWon(false);
      return;
    }
    // If successful
    toast.success(`${name} marked as WON!`);
    setIsClosingWon(false);
    router.refresh();
  };

  const closeQuoteLost = async () => {
    setIsClosingLost(true);
    const saResponse = await saCloseQuote({ quoteId, outcome: "lost" });

    if (!saResponse.success) {
      toast.error(
        `Error Closing Quote: ${
          saResponse.error || "There was an error closing the quote"
        }`,
      );
      setIsClosingLost(false);
      return;
    }
    // If successful
    toast.success(`${name} marked as LOST`);
    setIsClosingLost(false);
    router.refresh();
  };

  const reopenQuote = async () => {
    setIsReopening(true);
    const saResponse = await saReopenQuote({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Re-opening Quote: ${
          saResponse.error || "There was an error re-opening the quote"
        }`,
      );
      setIsReopening(false);
      return;
    }
    // If successful
    toast.success(`Successfully re-opened ${name}`);
    setIsReopening(false);
    router.refresh();
  };

  const returnToCostPricingReceived = async () => {
    setIsReturningToCostPricing(true);
    const saResponse = await saReturnQuoteToCostPricingReceived({ quoteId });

    if (!saResponse.success) {
      toast.error(
        `Error Returning Quote: ${
          saResponse.error || "There was an error returning the quote"
        }`,
      );
      setIsReturningToCostPricing(false);
      return;
    }
    // If successful
    toast.success(`${name} returned to Cost Pricing Received`);
    setIsReturningToCostPricing(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {canSendConceptToClient && (
        <Alert
          title={`Send ${name} Concept to Client`}
          description="Are you sure you want to send this concept to the client?"
          actionText="Send Concept"
          onAction={sendConceptToClient}
          destructive={false}
        >
          <Button className="cursor-pointer" size="sm">
            {isSendingConcept ? <Spinner /> : null}
            Send Concept
          </Button>
        </Alert>
      )}
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
      {canMarkSentToClient && (
        <Alert
          title={`Mark ${name} as Proposal with Client`}
          description="Are you sure you want to mark this quote as proposal with client?"
          actionText="Mark as Proposal with Client"
          onAction={markSentToClient}
          destructive={false}
        >
          <Button className="cursor-pointer" size="sm">
            {isMarkingSentToClient ? <Spinner /> : null}
            Mark as Proposal with Client
          </Button>
        </Alert>
      )}
      {canClose && (
        <>
          <Alert
            title={`Mark ${name} as WON`}
            description="Are you sure you want to mark this quote as won? This will close the quote."
            actionText="Mark as WON"
            onAction={closeQuoteWon}
            destructive={false}
          >
            <Button
              className="cursor-pointer bg-green-500 hover:bg-green-600"
              size="sm"
            >
              {isClosingWon ? <Spinner /> : null}
              WON
            </Button>
          </Alert>
          <Alert
            title={`Mark ${name} as LOST`}
            description="Are you sure you want to mark this quote as lost? This will close the quote."
            actionText="Mark as LOST"
            onAction={closeQuoteLost}
            destructive={true}
          >
            <Button
              className="cursor-pointer bg-red-500 hover:bg-red-600"
              size="sm"
            >
              {isClosingLost ? <Spinner /> : null}
              LOST
            </Button>
          </Alert>
        </>
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
              href={`/concepts/${shortLinkId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Concept
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/concepts/${shortLinkId}`,
              );
              toast.success("Concept link copied to clipboard");
            }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Concept Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <a
              href={`/proposals/${shortLinkId}`}
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
                `${window.location.origin}/proposals/${shortLinkId}`,
              );
              toast.success("Proposal link copied to clipboard");
            }}
            className="cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Proposal Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canReturnToDraft && (
            <>
              <DropdownMenuSeparator />
              <Alert
                title="Return to Draft Status"
                description="Are you sure you want to return this quote to Draft status? This will allow the specification to be edited again."
                actionText="Return to Draft"
                onAction={returnToDraft}
                destructive={false}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer"
                >
                  {isReturningToDraft ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Return to Draft
                </DropdownMenuItem>
              </Alert>
            </>
          )}
          {canReturnToConceptSent && (
            <>
              <Alert
                title="Return to Concept Sent to Client"
                description="Are you sure you want to return this quote to 'Concept Sent to Client' status?"
                actionText="Return to Concept Sent"
                onAction={returnToConceptSent}
                destructive={false}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer"
                >
                  {isReturningToConceptSent ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Undo2 className="h-4 w-4 mr-2" />
                  )}
                  Return to Concept Sent to Client
                </DropdownMenuItem>
              </Alert>
            </>
          )}
          {canReturnToCostPricing && (
            <>
              <Alert
                title="Return to Cost Pricing Received"
                description="Are you sure you want to return this quote to 'Cost Pricing Received from Voxd' status?"
                actionText="Return to Cost Pricing"
                onAction={returnToCostPricingReceived}
                destructive={false}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer"
                >
                  {isReturningToCostPricing ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Undo2 className="h-4 w-4 mr-2" />
                  )}
                  Return to Cost Pricing Received
                </DropdownMenuItem>
              </Alert>
            </>
          )}
          <Alert
            title={`Mark ${name} as Closed Lost`}
            description="Are you sure you want to mark this quote as closed lost? This will close the quote."
            actionText="Mark as Closed Lost"
            onAction={closeQuoteLost}
            destructive={true}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer text-destructive"
            >
              {isClosingLost ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2 text-destructive" />
              )}
              Mark as Closed Lost
            </DropdownMenuItem>
          </Alert>
          {canReopen && (
            <>
              <Alert
                title="Re-open Quote"
                description="Are you sure you want to re-open this quote? This will set the quote back to 'Proposal with Client' status."
                actionText="Re-open Quote"
                onAction={reopenQuote}
                destructive={false}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer"
                >
                  {isReopening ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : (
                    <RotateCw className="h-4 w-4 mr-2" />
                  )}
                  Re-open Quote
                </DropdownMenuItem>
              </Alert>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setCloneDialogOpen(true)}
            className="cursor-pointer"
          >
            <CopyPlus className="h-4 w-4 mr-2" />
            Clone to Organisation
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

      <CloneQuoteDialog
        quoteId={quoteId}
        quoteName={name}
        organisationName={organisationName}
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
      />
    </div>
  );
}
