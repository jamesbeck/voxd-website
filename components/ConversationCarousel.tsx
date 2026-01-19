"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WhatsAppSim from "@/components/whatsAppSim";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: number;
  annotation: string | null;
}

interface Conversation {
  id: string;
  description: string;
  startTime: string;
  messages: Message[];
}

interface ConversationCarouselProps {
  conversations: Conversation[];
  businessName: string;
  exampleId: string;
  logoFileExtension: string | null;
}

export default function ConversationCarousel({
  conversations,
  businessName,
  exampleId,
  logoFileExtension,
}: ConversationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? conversations.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === conversations.length - 1 ? 0 : prev + 1,
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (conversations.length === 0) return null;

  const currentConversation = conversations[currentIndex];

  return (
    <div className="w-[360px]">
      {/* Conversation description */}
      <div className="text-center mb-3">
        <p className="text-xs font-medium text-gray-700 line-clamp-2">
          {currentConversation.description}
        </p>
      </div>

      {/* WhatsApp Simulator */}
      <WhatsAppSim
        messages={currentConversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
          time: m.time,
          annotation: m.annotation || "",
        }))}
        businessName={businessName}
        startTime={currentConversation.startTime}
        exampleId={exampleId}
        logoFileExtension={logoFileExtension}
      />

      {/* Navigation Controls */}
      {conversations.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full"
            aria-label="Previous conversation"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {conversations.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to conversation ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full"
            aria-label="Next conversation"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
