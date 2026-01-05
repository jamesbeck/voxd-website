"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { key: "Draft", label: "Draft" },
  {
    key: "Sent to Voxd for Cost Pricing",
    label: "Sent to Voxd for Cost Pricing",
  },
  {
    key: "Cost Pricing Received from Voxd",
    label: "Cost Pricing Received from Voxd",
  },
  { key: "Sent to Client", label: "Sent to Client" },
  { key: "Closed", label: "Closed" },
];

export default function QuoteProgress({ status }: { status: string }) {
  const currentIndex = steps.findIndex((step) => step.key === status);

  return (
    <div className="w-full py-4">
      <div className="relative flex justify-between">
        {/* Background connector line - spans from first to last circle center */}
        <div
          className="absolute top-4 h-0.5 bg-muted-foreground/20"
          style={{ transform: "translateY(-50%)", left: "16px", right: "16px" }}
        />

        {/* Progress line overlay */}
        <div
          className="absolute top-4 h-0.5 bg-primary transition-all"
          style={{
            transform: "translateY(-50%)",
            left: "16px",
            width:
              currentIndex <= 0
                ? "0%"
                : `calc(${(currentIndex / (steps.length - 1)) * 100}% - 32px)`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.key}
              className={cn(
                "flex flex-col z-10",
                isFirst ? "items-start" : isLast ? "items-end" : "items-center"
              )}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground/50"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[100px]",
                  isCurrent
                    ? "text-primary font-semibold"
                    : isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
