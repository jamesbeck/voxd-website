"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const steps = [
  { key: "Draft", label: "Draft" },
  { key: "Concept Sent to Client", label: "Concept Sent to Client" },
  {
    key: "Sent to Voxd for Cost Pricing",
    label: "Sent to Voxd for Cost Pricing",
  },
  {
    key: "Cost Pricing Received from Voxd",
    label: "Cost Pricing Received from Voxd",
  },
  { key: "Proposal with Client", label: "Proposal with Client" },
  { key: "Closed", label: "Closed" }, // This will match both "Closed Won" and "Closed Lost"
];

export default function QuoteProgress({ status }: { status: string }) {
  // Handle both Closed Won and Closed Lost as the final stage
  const isClosedWon = status === "Closed Won";
  const isClosedLost = status === "Closed Lost";
  const isClosed = isClosedWon || isClosedLost;

  // Map the status to find the current index
  const normalizedStatus = isClosed ? "Closed" : status;
  const currentIndex = steps.findIndex((step) => step.key === normalizedStatus);
  const stepWidth = 100 / steps.length;
  const firstCircleCenter = stepWidth / 2; // Center of first step as percentage
  const lastCircleCenter = 100 - stepWidth / 2; // Center of last step as percentage
  const totalLineWidth = lastCircleCenter - firstCircleCenter; // Width from first to last circle center

  return (
    <div className="w-full py-4">
      <div className="relative flex">
        {/* Background connector line - spans from first to last circle center */}
        <div
          className="absolute top-4 h-0.5 bg-muted-foreground/20"
          style={{
            transform: "translateY(-50%)",
            left: `${firstCircleCenter}%`,
            right: `${100 - lastCircleCenter}%`,
          }}
        />

        {/* Progress line overlay */}
        <div
          className="absolute top-4 h-0.5 bg-primary transition-all"
          style={{
            transform: "translateY(-50%)",
            left: `${firstCircleCenter}%`,
            width:
              currentIndex <= 0
                ? "0%"
                : `${(totalLineWidth * currentIndex) / (steps.length - 1)}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClosedStep = step.key === "Closed";
          const isClosedWonStep = isClosedStep && isCurrent && isClosedWon;
          const isClosedLostStep = isClosedStep && isCurrent && isClosedLost;

          // Determine the label for the closed step
          const displayLabel =
            isClosedStep && isClosed
              ? isClosedWon
                ? "Closed Won"
                : "Closed Lost"
              : step.label;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center z-10"
              style={{ width: `${100 / steps.length}%` }}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  isClosedWonStep
                    ? "bg-green-500 border-green-500 text-white"
                    : isClosedLostStep
                      ? "bg-red-500 border-red-500 text-white"
                      : isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-background text-muted-foreground/50",
                )}
              >
                {isClosedWonStep ? (
                  <Check className="h-4 w-4" />
                ) : isClosedLostStep ? (
                  <X className="h-4 w-4" />
                ) : isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[100px]",
                  isClosedWonStep
                    ? "text-green-500 font-semibold"
                    : isClosedLostStep
                      ? "text-red-500 font-semibold"
                      : isCurrent
                        ? "text-primary font-semibold"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                )}
              >
                {displayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
