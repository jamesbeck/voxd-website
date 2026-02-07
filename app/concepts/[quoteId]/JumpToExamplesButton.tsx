"use client";

import { MessageSquare } from "lucide-react";

type JumpToExamplesButtonProps = {
  brandColor: string;
};

export default function JumpToExamplesButton({
  brandColor,
}: JumpToExamplesButtonProps) {
  const scrollToExamples = () => {
    const element = document.getElementById("examples");
    if (element) {
      // Account for fixed header height plus spacing to show section top edge
      const headerOffset = window.innerWidth >= 768 ? 104 : 88;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={scrollToExamples}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 whitespace-nowrap text-sm cursor-pointer"
      style={{ backgroundColor: brandColor }}
    >
      <MessageSquare className="h-4 w-4" />
      Jump to Examples
    </button>
  );
}
