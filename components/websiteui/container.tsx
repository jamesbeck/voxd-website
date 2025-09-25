import { cn } from "@/lib/utils";

export default function Container({
  children,
  colour,
}: {
  children: React.ReactNode;
  colour?: "green" | "white";
}) {
  const colourClass = colour == "green" ? "bg-primary text-white" : "bg-white";

  return (
    <div className={cn("w-full", colourClass)}>
      <div className="max-w-7xl mx-auto p-8">{children}</div>
    </div>
  );
}
