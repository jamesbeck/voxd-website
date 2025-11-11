import { cn } from "@/lib/utils";

export default function H1({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "text-2xl font-semibold border-b-1 border-lightgrey pb-3",
        className
      )}
    >
      {children}
    </h1>
  );
}
