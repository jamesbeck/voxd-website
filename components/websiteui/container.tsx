import { cn } from "@/lib/utils";

export default function Container({
  children,
  colour,
}: {
  children: React.ReactNode;
  colour?: "blue" | "primary" | "white";
}) {
  const colourClass = colour == "blue" || colour == "primary" ? "bg-primary text-white" : "bg-white";

  return (
    <div className={cn("w-full", colourClass)}>
      <div className="max-w-7xl mx-auto py-16 px-8">{children}</div>
    </div>
  );
}
