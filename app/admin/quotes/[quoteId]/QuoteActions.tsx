"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import RecordActions, {
  type ActionButton,
  type DropdownGroup,
} from "@/components/admin/RecordActions";

export default function QuoteActions({
  quoteId,
  shortLinkId,
  name,
  organisationName,
  organisationId,
  prototypingAgentId,
  status,
  canDelete,
  createdByAdminUserId,
  isSuperAdmin = false,
}: {
  quoteId: string;
  shortLinkId: string;
  name: string;
  organisationName: string;
  organisationId: string;
  prototypingAgentId: string | null;
  status: string;
  canDelete: boolean;
  createdByAdminUserId: string | null;
  isSuperAdmin?: boolean;
}) {
  const [isSubmittingForPricing, setIsSubmittingForPricing] = useState(false);
  const [isSendingConcept, setIsSendingConcept] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReturningToDraft, setIsReturningToDraft] = useState(false);

  const coreBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://core.voxd.ai";
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

  // Build workflow buttons based on status
  const workflowButtons: ActionButton[] = [];

  if (canSendConceptToClient) {
    workflowButtons.push({
      label: "Send Concept",
      loading: isSendingConcept,
      confirm: {
        title: `Send ${name} Concept to Client`,
        description:
          "Are you sure you want to send this concept to the client?",
        actionText: "Send Concept",
      },
      onClick: sendConceptToClient,
    });
  }

  if (canSubmitForPricing) {
    workflowButtons.push({
      label: "Submit to Voxd",
      loading: isSubmittingForPricing,
      confirm: {
        title: `Submit ${name} for Pricing`,
        description:
          "Are you sure you want to submit this quote for cost pricing from Voxd?",
        actionText: "Submit for Pricing",
      },
      onClick: submitForPricing,
    });
  }

  if (canMarkSentToClient) {
    workflowButtons.push({
      label: "Mark as Proposal with Client",
      loading: isMarkingSentToClient,
      confirm: {
        title: `Mark ${name} as Proposal with Client`,
        description:
          "Are you sure you want to mark this quote as proposal with client?",
        actionText: "Mark as Proposal with Client",
      },
      onClick: markSentToClient,
    });
  }

  if (canClose) {
    workflowButtons.push({
      label: "WON",
      loading: isClosingWon,
      className: "bg-green-500 hover:bg-green-600 text-white",
      confirm: {
        title: `Mark ${name} as WON`,
        description:
          "Are you sure you want to mark this quote as won? This will close the quote.",
        actionText: "Mark as WON",
      },
      onClick: closeQuoteWon,
    });
    workflowButtons.push({
      label: "LOST",
      variant: "destructive",
      loading: isClosingLost,
      confirm: {
        title: `Mark ${name} as LOST`,
        description:
          "Are you sure you want to mark this quote as lost? This will close the quote.",
        actionText: "Mark as LOST",
        destructive: true,
      },
      onClick: closeQuoteLost,
    });
  }

  // Build dropdown groups
  const dropdownGroups: DropdownGroup[] = [
    {
      items: [
        {
          label: "View Concept",
          icon: <ExternalLink />,
          href: `/concepts/${shortLinkId}`,
          target: "_blank",
        },
        {
          label: "Copy Concept Link",
          icon: <Copy />,
          onSelect: () => {
            navigator.clipboard.writeText(
              `${window.location.origin}/concepts/${shortLinkId}`,
            );
            toast.success("Concept link copied to clipboard");
          },
        },
      ],
    },
    {
      items: [
        {
          label: "View Proposal",
          icon: <ExternalLink />,
          href: `/proposals/${shortLinkId}`,
          target: "_blank",
        },
        {
          label: "Copy Proposal Link",
          icon: <Copy />,
          onSelect: () => {
            navigator.clipboard.writeText(
              `${window.location.origin}/proposals/${shortLinkId}`,
            );
            toast.success("Proposal link copied to clipboard");
          },
        },
      ],
    },
  ];

  // Test Prototype links (only if partner has a prototypingAgentId)
  if (prototypingAgentId) {
    const sessionData = encodeURIComponent(
      JSON.stringify({ quoteId }),
    );
    const prototypeUrl = `${coreBaseUrl}/web-client/test?brandAsOrganisationId=${encodeURIComponent(organisationId)}&agentId=${encodeURIComponent(prototypingAgentId)}&mode=fullscreen&sessionData=${sessionData}`;
    dropdownGroups.push({
      items: [
        {
          label: "Test Prototype",
          icon: <ExternalLink />,
          href: prototypeUrl,
          target: "_blank",
        },
        {
          label: "Copy Prototype Link",
          icon: <Copy />,
          onSelect: () => {
            navigator.clipboard.writeText(
              prototypeUrl,
            );
            toast.success("Prototype link copied to clipboard");
          },
        },
      ],
    });
  }

  // Status change items
  const statusItems = [];
  if (canReturnToDraft) {
    statusItems.push({
      label: "Return to Draft",
      icon: <RotateCcw />,
      loading: isReturningToDraft,
      confirm: {
        title: "Return to Draft Status",
        description:
          "Are you sure you want to return this quote to Draft status? This will allow the specification to be edited again.",
        actionText: "Return to Draft",
        onAction: returnToDraft,
      },
    });
  }
  if (canReturnToConceptSent) {
    statusItems.push({
      label: "Return to Concept Sent to Client",
      icon: <Undo2 />,
      loading: isReturningToConceptSent,
      confirm: {
        title: "Return to Concept Sent to Client",
        description:
          "Are you sure you want to return this quote to 'Concept Sent to Client' status?",
        actionText: "Return to Concept Sent",
        onAction: returnToConceptSent,
      },
    });
  }
  if (canReturnToCostPricing) {
    statusItems.push({
      label: "Return to Cost Pricing Received",
      icon: <Undo2 />,
      loading: isReturningToCostPricing,
      confirm: {
        title: "Return to Cost Pricing Received",
        description:
          "Are you sure you want to return this quote to 'Cost Pricing Received from Voxd' status?",
        actionText: "Return to Cost Pricing",
        onAction: returnToCostPricingReceived,
      },
    });
  }
  statusItems.push({
    label: "Mark as Closed Lost",
    icon: <XCircle />,
    danger: true,
    loading: isClosingLost,
    confirm: {
      title: `Mark ${name} as Closed Lost`,
      description:
        "Are you sure you want to mark this quote as closed lost? This will close the quote.",
      actionText: "Mark as Closed Lost",
      destructive: true,
      onAction: closeQuoteLost,
    },
  });
  if (canReopen) {
    statusItems.push({
      label: "Re-open Quote",
      icon: <RotateCw />,
      loading: isReopening,
      confirm: {
        title: "Re-open Quote",
        description:
          "Are you sure you want to re-open this quote? This will set the quote back to 'Proposal with Client' status.",
        actionText: "Re-open Quote",
        onAction: reopenQuote,
      },
    });
  }
  if (statusItems.length > 0) {
    dropdownGroups.push({ items: statusItems });
  }

  // Clone + management items
  const managementItems = [
    {
      label: "Clone to Organisation",
      icon: <CopyPlus />,
      onSelect: () => setCloneDialogOpen(true),
    },
  ];
  if (canDelete) {
    managementItems.push({
      label: "Change Owner",
      icon: <UserCog />,
      onSelect: () => setChangeOwnerOpen(true),
    });
  }
  dropdownGroups.push({ items: managementItems });

  if (canDelete) {
    dropdownGroups.push({
      items: [
        {
          label: "Delete Quote",
          icon: <Trash2 />,
          danger: true,
          loading: isDeleting,
          confirm: {
            title: `Delete ${name}`,
            description:
              "Are you sure you want to delete this quote? This action cannot be undone.",
            actionText: "Delete Quote",
            destructive: true,
            onAction: deleteQuote,
          },
        },
      ],
    });
  }

  return (
    <>
      <RecordActions
        buttons={workflowButtons}
        dropdown={{
          loading: isDeleting,
          groups: dropdownGroups,
        }}
      />

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
    </>
  );
}
