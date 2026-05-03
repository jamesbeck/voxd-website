"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BrandChipProps = {
  label: string;
  logoUrl?: string | null;
  backgroundColor?: string | null;
  fallback: React.ReactNode;
  className?: string;
};

export default function BrandChip({
  label,
  logoUrl,
  backgroundColor,
  fallback,
  className,
}: BrandChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "max-w-full gap-1.5 rounded-full border-slate-200 bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-700",
        className,
      )}
    >
      <span
        className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
            unoptimized
          />
        ) : (
          fallback
        )}
      </span>
      <span className="truncate">{label}</span>
    </Badge>
  );
}
