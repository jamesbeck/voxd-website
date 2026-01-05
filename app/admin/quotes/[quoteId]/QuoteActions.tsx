"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/admin/Alert";
import { Spinner } from "@/components/ui/spinner";
import saSubmitQuoteForCostPricing from "@/actions/saSubmitQuoteForCostPricing";

export default function QuoteActions({
  quoteId,
  name,
  status,
}: {
  quoteId: string;
  name: string;
  status: string;
}) {
  const [isSubmittingForPricing, setIsSubmittingForPricing] = useState(false);

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

  return (
    <div className="flex items-center gap-2">
      {canSubmitForPricing && (
        <Alert
          title={`Submit ${name} for Pricing`}
          description="Are you sure you want to submit this quote for cost pricing from Voxd?"
          actionText="Submit for Pricing"
          onAction={submitForPricing}
        >
          <Button className="cursor-pointer" size="sm">
            {isSubmittingForPricing ? <Spinner /> : null}
            Submit for Cost Pricing from Voxd
          </Button>
        </Alert>
      )}
    </div>
  );
}
