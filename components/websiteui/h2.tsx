import { cn } from "@/lib/utils";

export default function H2({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn("text-[24px] font-bold", className)}>{children}</h2>;
}
