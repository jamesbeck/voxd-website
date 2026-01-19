"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WhatsAppSim from "@/components/whatsAppSim";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Example } from "@/types/types";

interface ExampleCarouselProps {
  examples: Example[];
}

export default function ExampleCarousel({ examples }: ExampleCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (examples.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Embla Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {examples.map((example) => {
            // Get first conversation for WhatsApp sim
            const firstConversation = example.exampleConversations?.[0];

            return (
              <div key={example.id} className="flex-[0_0_100%] min-w-0">
                <div className="relative w-full h-[500px] md:h-[600px] lg:h-[800px]">
                  {/* Background Hero Image with Overlay */}
                  {example.heroImageFileExtension && (
                    <>
                      <Image
                        src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}.${example.heroImageFileExtension}`}
                        alt={example.title}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/50" />
                    </>
                  )}

                  {/* Content Container */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-4 w-full">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        {/* Left Side - Text Content */}
                        <div className="text-white space-y-6">
                          {/* Logo and Business Name */}
                          <div className="flex items-center gap-4">
                            {example.logoFileExtension && (
                              <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white rounded-lg p-2">
                                <div className="relative w-full h-full">
                                  <Image
                                    src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`}
                                    alt={`${example.businessName} logo`}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </div>
                            )}
                            <h3 className="text-2xl md:text-3xl font-bold">
                              {example.businessName}
                            </h3>
                          </div>

                          {/* Title */}
                          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                            {example.title}
                          </h2>

                          {/* Short Description */}
                          <p className="text-lg md:text-xl text-white/90">
                            {example.short}
                          </p>

                          {/* Read More Button */}
                          <Link
                            href={`/case-studies/${example.slug}`}
                            className="inline-block bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
                          >
                            Read More
                          </Link>

                          {/* Privacy Disclaimer */}
                          <p className="text-xs text-white/70 italic max-w-xl">
                            Please note: While this case study is based on a
                            real project, business names, branding, and other
                            identifying information have been modified to
                            protect client privacy.
                          </p>
                        </div>

                        {/* Right Side - WhatsApp Sim */}
                        {firstConversation && (
                          <div className="hidden lg:flex justify-center lg:justify-end">
                            <WhatsAppSim
                              messages={firstConversation.messages.map((m) => ({
                                role: m.role,
                                content: m.content,
                                time: m.time,
                                annotation: m.annotation || "",
                              }))}
                              businessName={example.businessName}
                              startTime={firstConversation.startTime}
                              exampleId={example.id}
                              logoFileExtension={example.logoFileExtension}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      {examples.length > 1 && (
        <>
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white z-10"
            aria-label="Previous example"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white z-10"
            aria-label="Next example"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
