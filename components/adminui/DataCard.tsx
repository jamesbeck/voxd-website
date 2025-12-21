"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface DataItem {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

interface DataCardProps {
  items: DataItem[];
  className?: string;
}

const variantStyles = {
  default: "bg-muted/50",
  success: "bg-emerald-500/10 border-emerald-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  danger: "bg-red-500/10 border-red-500/20",
  info: "bg-blue-500/10 border-blue-500/20",
};

const variantTextStyles = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
};

export default function DataCard({ items, className }: DataCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm overflow-hidden divide-y",
        className
      )}
    >
      {items.map((item, index) => (
        <DataCardItem key={index} item={item} />
      ))}
    </div>
  );
}

function DataCardItem({ item }: { item: DataItem }) {
  const variant = item.variant || "default";

  return (
    <div className="group px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-3">
        {item.icon && (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
              variantStyles[variant]
            )}
          >
            <span className={cn("text-sm", variantTextStyles[variant])}>
              {item.icon}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {item.label}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-sm font-semibold tracking-tight",
                variantTextStyles[variant]
              )}
            >
              {item.value}
            </span>
            {item.description && (
              <span className="text-[11px] text-muted-foreground/70">
                {item.description}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Alternative compact display for inline stats
export function DataCardCompact({
  items,
  className,
}: {
  items: DataItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-6 rounded-xl border bg-card p-5 shadow-sm",
        className
      )}
    >
      {items.map((item, index) => {
        const variant = item.variant || "default";
        return (
          <div key={index} className="flex items-center gap-3">
            {item.icon && (
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border",
                  variantStyles[variant]
                )}
              >
                <span className={cn("text-base", variantTextStyles[variant])}>
                  {item.icon}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  variantTextStyles[variant]
                )}
              >
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List-style display for longer content
export function DataCardList({
  items,
  className,
}: {
  items: DataItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm divide-y overflow-hidden",
        className
      )}
    >
      {items.map((item, index) => {
        const variant = item.variant || "default";
        return (
          <div
            key={index}
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border",
                    variantStyles[variant]
                  )}
                >
                  <span className={cn("text-base", variantTextStyles[variant])}>
                    {item.icon}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            <div
              className={cn(
                "text-sm font-semibold text-right",
                variantTextStyles[variant]
              )}
            >
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
