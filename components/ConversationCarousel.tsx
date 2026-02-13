"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WhatsAppSim from "@/components/whatsAppSim";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: number;
  annotation: string | null;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  if (conversations.length === 0) return null;

  return (
    <div className="w-[360px]">
      {/* Embla Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex-[0_0_100%] min-w-0">
              {/* Conversation description */}
              <div className="text-center mb-3">
                <p className="text-xs font-medium text-gray-700 line-clamp-2 px-2">
                  {conversation.description}
                </p>
              </div>

              {/* WhatsApp Simulator */}
              <WhatsAppSim
                messages={conversation.messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                  time: m.time,
                  annotation: m.annotation || "",
                  imageUrl: m.imageUrl,
                  fileName: m.fileName,
                  fileSize: m.fileSize,
                }))}
                businessName={businessName}
                startTime={conversation.startTime}
                exampleId={exampleId}
                logoFileExtension={logoFileExtension}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      {conversations.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
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
                onClick={() => scrollTo(index)}
                className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                aria-label={`Go to conversation ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
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
