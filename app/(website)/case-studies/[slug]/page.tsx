import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { getExampleForPublic } from "@/lib/getExampleForPublic";
import ConversationCarousel from "@/components/ConversationCarousel";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Metadata } from "next";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const example = await getExampleForPublic({ slug });

  if (!example) {
    return {
      title: "Case Study Not Found",
      description: "The requested case study could not be found.",
    };
  }

  const title = `${example.title} - ${example.businessName} | Voxd Case Study`;
  const description =
    example.short || `Discover how ${example.businessName} uses AI chatbots.`;

  const ogImage = example.heroImageFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}_og.${example.heroImageFileExtension}`
    : example.logoFileExtension
      ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`
      : null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const example = await getExampleForPublic({ slug });

  if (!example) {
    notFound();
  }

  const brandColor = "#6366f1"; // Default brand color for case studies

  const exampleLogoUrl = example.logoFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image with overlay content */}
      {example.heroImageFileExtension && (
        <div className="relative w-full h-[250px] md:h-[350px] lg:h-[450px]">
          <Image
            src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}.${example.heroImageFileExtension}`}
            alt={example.title}
            width={1920}
            height={600}
            unoptimized
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-5xl mx-auto px-4 pb-8 md:pb-12 lg:pb-16 w-full">
              <div className="flex items-start gap-4 md:gap-6">
                {exampleLogoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={exampleLogoUrl}
                      alt={`${example.businessName} Logo`}
                      width={120}
                      height={120}
                      unoptimized
                      className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 object-contain rounded-lg bg-white p-2 shadow-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white drop-shadow-lg">
                    {example.title}
                  </h1>
                  <p className="text-white/90 text-sm md:text-base lg:text-lg mt-2 drop-shadow">
                    {example.businessName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main content */}
        <main className="bg-white rounded-xl shadow-sm p-6 lg:p-12">
          {/* Case Study Content with floating WhatsApp sims */}
          <article className="prose prose-gray prose-lg max-w-none">
            {example.short && (
              <p className="lead text-xl text-gray-700 leading-relaxed mb-8">
                {example.short}
              </p>
            )}

            {/* Floating WhatsApp Simulator Carousel */}
            {example.exampleConversations.length > 0 && (
              <div className="float-right ml-6 mb-6 clear-right">
                <ConversationCarousel
                  conversations={example.exampleConversations}
                  businessName={example.businessName}
                  exampleId={example.id}
                  logoFileExtension={example.logoFileExtension}
                />
              </div>
            )}

            {example.body && <MarkdownContent content={example.body} />}
          </article>

          {/* Back to Case Studies Link */}
          <div className="flex justify-center py-8">
            <a
              href="/case-studies"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Back to Case Studies
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
