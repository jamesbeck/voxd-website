import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import type { Metadata } from "next";
import { FileText, MessageSquare } from "lucide-react";
import { getExampleForPublic } from "@/lib/getExampleForPublic";
import ExampleConversationsAccordion from "@/components/ExampleConversationsAccordion";
import { MarkdownContent } from "@/components/MarkdownContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const example = await getExampleForPublic({ slug });

  if (!example) {
    return {
      title: "Example Not Found",
      description: "The requested example could not be found.",
    };
  }

  const title = `${example.title} | ${example.partner.name}`;
  const description =
    example.short ||
    `See how ${example.businessName} uses AI chatbots on WhatsApp`;

  // Use optimized OG version of hero image (1200x630, <600KB for WhatsApp compatibility)
  const ogImage = example.heroImageFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}_og.${example.heroImageFileExtension}`
    : example.logoFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`
    : example.partner.domain
    ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${example.partner.domain}`
    : null;

  // Get current host from request headers
  const headersList = await headers();
  const host = headersList.get("host") || "voxd.io";
  const protocol = host.includes("localhost") ? "http" : "https";
  const pageUrl = `${protocol}://${host}/examples/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: example.partner.name,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${example.businessName} Logo`,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && {
        images: [ogImage],
      }),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const example = await getExampleForPublic({ slug });

  if (!example) {
    return notFound();
  }

  const brandColor = example.partner.colour
    ? `#${example.partner.colour}`
    : "#6366f1";
  const partnerLogoUrl = example.partner.domain
    ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${example.partner.domain}`
    : "/logo.svg";

  const exampleLogoUrl = example.logoFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with partner logo */}
      <header className="sticky top-0 z-50 py-4 px-4 bg-white border-b">
        <div className="max-w-3xl xl:max-w-6xl mx-auto flex items-center justify-center">
          <Image
            src={partnerLogoUrl}
            alt={example.partner.name}
            width={180}
            height={60}
            unoptimized
            className="h-8 sm:h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Hero Image */}
      {example.heroImageFileExtension && (
        <div className="relative w-full">
          <Image
            src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}.${example.heroImageFileExtension}`}
            alt={example.title}
            width={1920}
            height={600}
            unoptimized
            className="w-full h-[250px] md:h-[350px] object-cover"
          />
        </div>
      )}

      {/* Content wrapper */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Main content */}
        <main className="space-y-8">
          {/* Overview Section */}
          <section
            id="overview"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-6">
              {exampleLogoUrl && (
                <div className="flex-shrink-0">
                  <Image
                    src={exampleLogoUrl}
                    alt={`${example.businessName} Logo`}
                    width={120}
                    height={120}
                    unoptimized
                    className="w-28 h-28 md:w-40 md:h-40 object-contain rounded-lg bg-white border border-gray-200"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {example.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {example.businessName}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {example.body ? (
                <div className="prose prose-gray max-w-none">
                  <MarkdownContent content={example.body} />
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Details are being prepared. Please check back soon.
                </p>
              )}
            </div>
          </section>

          {/* Example Conversations Section */}
          {example.exampleConversations.length > 0 && (
            <section
              id="examples"
              className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <MessageSquare
                    className="h-6 w-6"
                    style={{ color: brandColor }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Example Conversations
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    See how this chatbot interacts with users
                  </p>
                </div>
              </div>

              <ExampleConversationsAccordion
                conversations={example.exampleConversations}
                businessName={example.businessName}
                brandColor={brandColor}
                exampleId={example.id}
                logoFileExtension={example.logoFileExtension}
              />
            </section>
          )}

          {/* Footer */}
          <footer className="flex justify-center py-8">
            <Image
              src={partnerLogoUrl}
              alt={example.partner.name}
              width={120}
              height={40}
              unoptimized
              className="h-8 w-auto object-contain opacity-50"
            />
          </footer>
        </main>
      </div>
    </div>
  );
}
