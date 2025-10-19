import { cn } from "@/lib/utils";

export default function H2({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h1 className={cn("text-xl font-semibold", className)}>{children}</h1>;
}
