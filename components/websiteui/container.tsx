import { cn } from "@/lib/utils";
import CircuitPattern from "./CircuitPattern";

export default function Container({
  children,
  colour,
  header,
}: {
  children: React.ReactNode;
  colour?: "blue" | "primary" | "white";
  header?: boolean;
}) {
  const isBlue = colour == "blue" || colour == "primary";
  const colourClass = isBlue
    ? header
      ? "bg-gradient-to-br from-primary from-60% to-fuchsia-600/50 text-white"
      : "bg-primary text-white"
    : "bg-white";

  return (
    <div className={cn("w-full relative overflow-hidden", colourClass)}>
      {isBlue && header && <CircuitPattern />}
      <div className="max-w-6xl mx-auto py-16 px-8 relative z-10">
        {children}
      </div>
    </div>
  );
}
